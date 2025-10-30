import axios from 'axios';
import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ValidateResponse = {
  resultado?: string;
  finish_reason?: string;
  letter?: string;
  photo_file_id?: string;
  pdf_file_id?: string;
  erro?: string;
};

export default function ValidateSignScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isShort = height < 720; // telas mais baixinhas
  const cameraHeight = Math.min(420, Math.max(240, Math.floor(height * 0.42)));

  const { letter } = useLocalSearchParams<{ letter: string }>();
  const targetLetter = String(letter || '').toUpperCase();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const BaseScreen = ({ children }: { children: React.ReactNode }) => (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />
      {children}
    </View>
  );

  if (!permission) {
    return (
      <BaseScreen>
        <View style={styles.center}>
          <Text style={styles.message}>Solicitando permissão da câmera…</Text>
        </View>
      </BaseScreen>
    );
  }

  if (!permission.granted) {
    return (
      <BaseScreen>
        <View style={styles.center}>
          <Text style={styles.message}>Precisamos da câmera para validar o sinal.</Text>
          <StyledButton
            label="Permitir Câmera"
            onPress={async () => {
              await requestPermission();
            }}
            fullWidth
          />
        </View>
      </BaseScreen>
    );
  }

  const getBaseURL = () => {
    if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
    return 'http://192.168.1.22:8000';
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const captured = await cameraRef.current.takePictureAsync();
      setPhoto(captured);
      setResult(null);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Não foi possível capturar a foto.');
    }
  };

  const sendPhoto = async () => {
    if (!photo) {
      setErrorMsg('Nenhuma foto capturada');
      return;
    }
    setLoading(true);
    setResult(null);
    setErrorMsg(null);

    const formData = new FormData();
    const fileUri = photo.uri.startsWith('file://') ? photo.uri : `file://${photo.uri}`;

    formData.append('letter', targetLetter);
    formData.append('photo', {
      uri: fileUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const res = await axios.post<ValidateResponse>(`${getBaseURL()}/validate-libras`, formData, {
        timeout: 20000,
      });
      setResult(res.data);
    } catch (e: any) {
      console.log('Upload error:', e?.message, e?.response?.data);
      const apiErr: string | undefined = e?.response?.data?.erro;
      setErrorMsg(apiErr ?? 'Falha ao enviar imagem (rede/host/HTTPS).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseScreen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Validar Sinal</Text>
        <Text style={styles.headerSubtitle}>
          Letra alvo: <Text style={styles.letter}>{targetLetter}</Text>
        </Text>
      </View>

      {/* SCROLL habilitado */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: 20 + insets.bottom }]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {!photo ? (
          <>
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>Alinhe a mão com boa iluminação, enquadre rosto e mão.</Text>
              <Text style={styles.tipTextMuted}>Dica: evite contraluz e mantenha o celular estável.</Text>
            </View>

            <View style={[styles.cameraWrap, { height: cameraHeight }]}>
              <CameraView ref={cameraRef} style={styles.cameraFill} facing="front" />
            </View>

            <StyledButton
              label="📸 Tirar Foto"
              onPress={takePhoto}
              kind="primary"
              fullWidth
              style={{ marginTop: 16 }}
            />
          </>
        ) : (
          <>
            <View style={[styles.previewWrap, { height: cameraHeight }]}>
              <Image source={{ uri: photo.uri }} style={styles.previewFill} />
            </View>

            <View style={[styles.actionsRow, isShort && { flexDirection: 'column' }]}>
              <StyledButton
                label="✅ Enviar"
                onPress={sendPhoto}
                kind="primary"
                fullWidth={isShort}
                style={!isShort ? { minWidth: width / 2 - 24 } : undefined}
                disabled={loading}
              />
              <StyledButton
                label="🔁 Tirar Outra"
                onPress={() => {
                  setPhoto(null);
                  setResult(null);
                  setErrorMsg(null);
                }}
                kind="secondary"
                fullWidth={isShort}
                style={!isShort ? { minWidth: width / 2 - 24 } : undefined}
                disabled={loading}
              />
            </View>
          </>
        )}

        {/* Card de resultado */}
        {result?.resultado && (
          <View style={styles.cardSuccess}>
            <Text style={styles.cardTitle}>Resultado do Sinal</Text>
            <Text style={styles.cardResult}>{result.resultado}</Text>
            <View style={styles.cardMetaRow}>
              {result.finish_reason ? (
                <Text style={styles.cardMeta}>Motivo de término: {result.finish_reason}</Text>
              ) : null}
              {result.letter ? <Text style={styles.cardMeta}>Letra: {result.letter}</Text> : null}
            </View>
          </View>
        )}

        {/* Card de erro */}
        {errorMsg && (
          <View style={styles.cardError}>
            <Text style={styles.cardTitle}>Não foi possível validar</Text>
            <Text style={styles.cardErrorText}>{errorMsg}</Text>
          </View>
        )}
      </ScrollView>

      {/* Overlay de loading ocupando a tela toda */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingOverlayText}>Validando sinal…</Text>
          </View>
        </View>
      )}
    </BaseScreen>
  );
}

/* ---------- Botão estilizado ---------- */
function StyledButton({
  label,
  onPress,
  disabled,
  kind = 'primary',
  style,
  fullWidth = false,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  kind?: 'primary' | 'secondary';
  style?: any;
  fullWidth?: boolean;
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
        fullWidth ? styles.btnFullWidth : null,
        style,
      ]}
    >
      <Text style={[styles.btnLabel, isPrimary ? styles.btnLabelPrimary : styles.btnLabelSecondary]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: { color: '#11181C', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(0,0,0,0.7)', marginTop: 4, fontSize: 14 },
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

  cameraWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    width: '100%',
  },
  cameraFill: { width: '100%', height: '100%' },

  previewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    width: '100%',
    alignSelf: 'stretch',
  },
  previewFill: { width: '100%', height: '100%' },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },

  /* cards */
  cardSuccess: {
    marginTop: 6,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(28, 181, 98, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(28, 181, 98, 0.28)',
  },
  cardError: {
    marginTop: 6,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(244, 67, 54, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.30)',
  },
  cardTitle: { color: '#11181C', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardResult: { color: '#0F5132', fontSize: 15, lineHeight: 20 },
  cardMetaRow: { marginTop: 8, gap: 4 },
  cardMeta: { color: 'rgba(0,0,0,0.7)', fontSize: 12 },
  cardErrorText: { color: '#842029', fontSize: 13, fontWeight: '600' },

  /* buttons */
  btnBase: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  btnFullWidth: { alignSelf: 'stretch' },
  btnPrimary: {
    backgroundColor: '#0B57D0',
    borderColor: '#0B57D0',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0,0,0,0.18)',
  },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { transform: [{ scale: 0.99 }] },
  btnLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  btnLabelPrimary: { color: '#ffffff' },
  btnLabelSecondary: { color: '#11181C' },

  message: { textAlign: 'center', fontSize: 16, margin: 20, color: '#11181C' },

  /* overlay de loading */
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    gap: 8,
  },
  loadingOverlayText: {
    color: '#11181C',
    fontSize: 14,
    fontWeight: '600',
  },
});
