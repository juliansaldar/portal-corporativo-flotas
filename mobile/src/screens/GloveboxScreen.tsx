import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { DUMMY_VEHICLE_PROFILE } from '../data/dummyVehicleProfile'

/**
 * Vista placeholder: solo lista documentos dummy, sin llamadas de red ni
 * acciones reales (ver design.md, Non-Goals).
 */
export function GloveboxScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Guantera Digital</Text>
      <Text style={styles.subtitle}>
        {DUMMY_VEHICLE_PROFILE.model} • {DUMMY_VEHICLE_PROFILE.plate} (datos de ejemplo)
      </Text>
      {DUMMY_VEHICLE_PROFILE.documents.map((doc) => (
        <View key={doc.name} style={styles.card}>
          <Text style={styles.cardTitle}>{doc.name}</Text>
          <Text style={styles.cardSubtitle}>
            Vigente hasta {doc.expiresAt} • {doc.issuer}
          </Text>
        </View>
      ))}
      <Text style={styles.footnote}>
        Próximamente: subir/renovar documentos. Esta sección todavía no está conectada a ningún
        backend.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080808' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 18, color: '#f5f7fa', fontWeight: '700' },
  subtitle: { fontSize: 11, color: '#a7b4c2', marginBottom: 4 },
  card: {
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
  },
  cardTitle: { fontSize: 13, color: '#f5f7fa', fontWeight: '700' },
  cardSubtitle: { fontSize: 11, color: '#a7b4c2', marginTop: 2 },
  footnote: { fontSize: 10, color: '#a7b4c2', marginTop: 12, fontStyle: 'italic' },
})
