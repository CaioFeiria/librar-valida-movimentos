import axios from 'axios';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DRIVE_PARENT_ID = process.env.EXPO_PUBLIC_DRIVE_PARENT_ID!;
const STATIC_TOKEN = process.env.EXPO_PUBLIC_GOOGLE_ACCESS_TOKEN || '';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

async function getGoogleAccessToken(): Promise<string> {
  if (!STATIC_TOKEN) throw new Error('Token do Google não encontrado no .env (EXPO_PUBLIC_GOOGLE_ACCESS_TOKEN).');
  return STATIC_TOKEN;
}
const buildDriveMediaUrl = (fileId: string) => `${DRIVE_API_BASE}/files/${fileId}?alt=media`;

async function findDriveVideoByName(
  filename: string,
  parentId: string,
  token: string
): Promise<{ id: string; name: string; thumbnailLink?: string } | null> {
  const q = `mimeType contains 'video/' and '${parentId}' in parents and name = '${filename}'`;
  const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name,thumbnailLink)`;
  const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return data?.files?.[0] ?? null;
}

export default function VideoLessonByLetter() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { letter } = useLocalSearchParams<{ letter?: string }>();
  const targetLetter = String(letter || '')
    .trim()
    .toUpperCase();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Video Aula ${targetLetter}`,
      headerBackTitle: `Letra ${targetLetter}`,
    });
  }, [navigation, targetLetter]);

  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);

  const videoRef = useRef<Video | null>(null);

  const filename = useMemo(() => (targetLetter ? `vletter_${targetLetter.toLowerCase()}.mp4` : null), [targetLetter]);

  const load = useCallback(async () => {
    if (!filename) {
      setErrorMsg('Letra não informada.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setVideoLoading(true); // bloqueia a tela até o <Video> carregar
    try {
      const token = await getGoogleAccessToken();
      setAuthToken(token);
      const file = await findDriveVideoByName(filename, DRIVE_PARENT_ID, token);
      if (!file?.id) {
        setErrorMsg(`Vídeo não encontrado: ${filename}`);
        setLoading(false);
        setVideoLoading(false);
        return;
      }
      setMediaUrl(buildDriveMediaUrl(file.id));
      setThumbnail(file.thumbnailLink);
    } catch (e: any) {
      setErrorMsg(
        e?.message?.includes('Token do Google')
          ? 'Access token do Google ausente. Coloque no .env.'
          : 'Falha ao buscar o vídeo no Google Drive.'
      );
      setVideoLoading(false);
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    load();
  }, [load]);

  const BaseScreen = ({ children }: { children: React.ReactNode }) => (
    <View style={[styles.safe, { paddingTop: 0, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />
      {children}
    </View>
  );

  // bloqueio global: enquanto busca URL ou o <Video> ainda não terminou de carregar
  const blocking = (loading || (mediaUrl && videoLoading)) && !errorMsg;

  return (
    <BaseScreen>
      {/* Cabeçalho colado */}
      <View style={[styles.header, { paddingTop: 4, paddingBottom: 6 }]}>
        <Text style={styles.headerTitle}>Aula em Vídeo</Text>
        {!!targetLetter && (
          <Text style={styles.headerSubtitle}>
            Letra alvo: <Text style={styles.letter}>{targetLetter}</Text>
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: 20 + insets.bottom }]}
        showsVerticalScrollIndicator
        scrollEnabled={!blocking} // ← impede scroll enquanto carrega
      >
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>Observe a posição da mão e a fluidez do movimento.</Text>
          <Text style={styles.tipTextMuted}>Use pausa/retrocesso para treinar detalhes.</Text>
        </View>

        <View style={styles.playerCard}>
          {/* TÍTULO DO VÍDEO REMOVIDO DO CARD */}

          {loading ? (
            <View style={[styles.playerWrap, styles.centerBox]}>
              <ActivityIndicator size="large" />
            </View>
          ) : errorMsg ? (
            <View style={[styles.cardError, { marginTop: 8 }]}>
              <Text style={styles.cardTitle}>Não foi possível carregar o vídeo</Text>
              <Text style={styles.cardErrorText}>{errorMsg}</Text>
              <StyledButton label="Tentar novamente" onPress={load} kind="secondary" style={{ marginTop: 10 }} />
            </View>
          ) : mediaUrl ? (
            <View style={[styles.playerWrap, { aspectRatio: 16 / 9 }]}>
              <Video
                ref={videoRef}
                style={styles.playerFill}
                source={{
                  uri: mediaUrl,
                  headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                posterSource={thumbnail ? { uri: thumbnail } : undefined}
                posterStyle={{ width: '100%', height: '100%' }}
                onLoadStart={() => setVideoLoading(true)}
                onLoad={() => setVideoLoading(false)} // ← libera interação só ao terminar
                onError={() => setVideoLoading(false)}
              />
            </View>
          ) : (
            <View style={[styles.playerWrap, { aspectRatio: 16 / 9 }]}>
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.playerFill} resizeMode="cover" />
              ) : (
                <View style={[styles.thumbFallback, styles.centerBox]}>
                  <Text style={styles.thumbFallbackText}>Prévia indisponível</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.actionsRow} pointerEvents={blocking ? 'none' : 'auto'}>
            <StyledButton
              label="Reproduzir/Pausar"
              onPress={async () => {
                if (!videoRef.current) return;
                const status = await videoRef.current.getStatusAsync();
                if (status.isLoaded) {
                  if (status.isPlaying) await videoRef.current.pauseAsync();
                  else await videoRef.current.playAsync();
                }
              }}
              kind="primary"
            />
            <StyledButton
              label="↺ Reiniciar"
              onPress={async () => {
                if (!videoRef.current) return;
                const status = await videoRef.current.getStatusAsync();
                if (status.isLoaded) {
                  await videoRef.current.setPositionAsync(0);
                  await videoRef.current.playAsync();
                }
              }}
              kind="secondary"
            />
          </View>
        </View>

        {/* Expansion Pane: Dicas */}
        <View style={styles.expansion}>
          <Pressable style={styles.expansionHeader} onPress={() => !blocking && setTipsOpen((v) => !v)}>
            <Text style={styles.expansionTitle}>Dicas</Text>
            <Text style={styles.expansionIcon}>{tipsOpen ? '▲' : '▼'}</Text>
          </Pressable>
          {tipsOpen && (
            <View style={styles.expansionBody}>
              <Text style={styles.cardResult}>• Posição dos dedos e orientação da palma</Text>
              <Text style={styles.cardResult}>• Altura do gesto em relação ao rosto</Text>
              <Text style={styles.cardResult}>• Direção, amplitude e fluidez</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* OVERLAY bloqueante global */}
      {blocking && (
        <View style={styles.blockOverlay} pointerEvents="auto">
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando vídeo…</Text>
          </View>
        </View>
      )}
    </BaseScreen>
  );
}

function StyledButton({
  label,
  onPress,
  disabled,
  kind = 'primary',
  style,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  kind?: 'primary' | 'secondary';
  style?: any;
}) {
  const isPrimary = kind === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
        style,
      ]}
    >
      <Text style={[styles.btnLabel, isPrimary ? styles.btnLabelPrimary : styles.btnLabelSecondary]}>{label}</Text>
    </Pressable>
  );
}

/* ===== estilos ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  centerBox: { alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: { color: '#11181C', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(0,0,0,0.7)', marginTop: 2, fontSize: 14 },
  letter: { color: '#0B57D0', fontWeight: '800' },

  scroll: { flex: 1 },
  scrollInner: { padding: 20, rowGap: 12 },

  tipBox: {
    backgroundColor: 'rgba(11, 87, 208, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(11, 87, 208, 0.18)',
    padding: 12,
    borderRadius: 12,
  },
  tipText: { color: '#222', fontSize: 14 },
  tipTextMuted: { color: 'rgba(0,0,0,0.65)', fontSize: 12, marginTop: 4 },

  playerCard: {
    marginTop: 4,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  playerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#000',
  },
  playerFill: { width: '100%', height: '100%' },

  thumbFallback: { width: '100%', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12 },
  thumbFallbackText: { color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },

  cardTitle: { color: '#11181C', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardResult: { color: '#0F5132', fontSize: 15, lineHeight: 20 },

  cardError: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(244, 67, 54, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.30)',
  },
  cardErrorText: { color: '#842029', fontSize: 13, fontWeight: '600' },

  // Expansion Pane
  expansion: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  expansionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  expansionTitle: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  expansionIcon: { fontSize: 14, color: 'rgba(0,0,0,0.6)' },
  expansionBody: { padding: 14, gap: 6, backgroundColor: 'rgba(28,181,98,0.10)' },

  // Overlay bloqueante
  blockOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: '#11181C', fontSize: 14, fontWeight: '600' },

  // Buttons
  btnBase: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  btnPrimary: { backgroundColor: '#0B57D0', borderColor: '#0B57D0' },
  btnSecondary: { backgroundColor: 'transparent', borderColor: 'rgba(0,0,0,0.18)' },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { transform: [{ scale: 0.99 }] },
  btnLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  btnLabelPrimary: { color: '#ffffff' },
  btnLabelSecondary: { color: '#11181C' },
});
