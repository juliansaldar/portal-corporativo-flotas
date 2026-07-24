import { StyleSheet, Text, View } from 'react-native'

/**
 * Vista placeholder: NO dispara ninguna llamada real (ver design.md,
 * Non-Goals, y specs/driver-mobile-app/spec.md, requirement "Vistas
 * placeholder sin funcionalidad simulada").
 */
export function SosScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.icon}>🆘</Text>
      <Text style={styles.title}>SOS</Text>
      <Text style={styles.body}>
        Esta función todavía no está disponible en este MVP. En una versión futura conectaría con
        un servicio real de asistencia/emergencia — por ahora no envía ninguna alerta ni llamada.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  icon: { fontSize: 40 },
  title: { fontSize: 18, color: '#ff4d4d', fontWeight: '700' },
  body: { fontSize: 12, color: '#a7b4c2', textAlign: 'center' },
})
