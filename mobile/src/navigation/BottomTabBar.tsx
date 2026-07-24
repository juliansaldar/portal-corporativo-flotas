import { Pressable, StyleSheet, Text, View } from 'react-native'

export type TabKey = 'home' | 'tracking' | 'glovebox' | 'sos'

interface Tab {
  key: TabKey
  label: string
  icon: string
}

const TABS: Tab[] = [
  { key: 'home', label: 'Inicio', icon: '🏠' },
  { key: 'tracking', label: 'Rastreo', icon: '📍' },
  { key: 'glovebox', label: 'Guantera', icon: '📁' },
  { key: 'sos', label: 'SOS', icon: '🆘' },
]

interface BottomTabBarProps {
  active: TabKey
  onSelect: (tab: TabKey) => void
}

export function BottomTabBar({ active, onSelect }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active
        const isSos = tab.key === 'sos'
        return (
          <Pressable key={tab.key} onPress={() => onSelect(tab.key)} style={styles.item}>
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive, isSos && styles.labelSos]}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f1f2c',
    backgroundColor: '#0c0c12',
  },
  item: {
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 10,
    color: '#a7b4c2',
  },
  labelActive: {
    color: '#00ffc2',
    fontWeight: '700',
  },
  labelSos: {
    color: '#ff4d4d',
    fontWeight: '700',
  },
})
