import axios from 'axios';
import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, View } from 'react-native';

export default function LetterScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [loading, setLoading] = useState(false);

  if (!permission) return <Text style={styles.message}>Solicitando permissão...</Text>;

  if (!permission.granted)
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Permita o uso da câmera</Text>
        <Button title="Permitir" onPress={requestPermission} />
      </View>
    );

  const takePhoto = async () => {
    if (cameraRef.current) {
      const captured = await cameraRef.current.takePictureAsync();
      setPhoto(captured);
    }
  };

  const sendPhoto = async () => {
    if (!photo) return Alert.alert('Erro', 'Nenhuma foto capturada');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: photo.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
    try {
      const res = await axios.post('http://SEU_IP_LOCAL:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Sucesso', `Resultado: ${res.data.result}`);
    } catch (e) {
      Alert.alert('Erro', 'Falha ao enviar imagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Letra: {letter}</Text>
      {!photo ? (
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
      ) : (
        <Image source={{ uri: photo.uri }} style={styles.preview} />
      )}
      {!photo ? (
        <Button title="Tirar Foto" onPress={takePhoto} />
      ) : (
        <>
          <Button title={loading ? 'Enviando...' : 'Enviar'} onPress={sendPhoto} disabled={loading} />
          <Button title="Tirar Outra" onPress={() => setPhoto(null)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  message: { textAlign: 'center', fontSize: 16, margin: 20 },
  camera: { width: '100%', height: 400, borderRadius: 16, overflow: 'hidden' },
  preview: { width: 300, height: 400, borderRadius: 16, marginVertical: 20 },
});
