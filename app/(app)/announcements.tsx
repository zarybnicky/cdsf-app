import { FlatList, StyleSheet, View } from 'react-native';

import AnnouncementCard, { type AnnouncementCardProps } from '@/components/AnnouncementCard';
import { Text } from '@/components/Themed';

const announcements: AnnouncementCardProps[] = [
  {
    title: 'Odhlaseni ze souteze',
    publishedAt: '/ ST 11. 3. 2026 / 11:56',
    markdown: `Bylo zaregistrovano odhlaseni ze soutezni akce

- **Mistrovstvi Ceske republiky 2026** v tanecnim sportu
- **Soutezici:** Zarybnicky Jakub, Hegerova Veronika
- **Soutez:** MCR Dospeli O 10T`,
  },
  {
    title: 'Odhlaseni ze souteze',
    publishedAt: '/ CT 26. 2. 2026 / 12:12',
    markdown: `Bylo zaregistrovano odhlaseni ze soutezni akce

- **Mistrovstvi CR 2026** v tanecnim sportu - latinskoamericke tance
- **Kona se dne:** 28. 2. 2026
- **Soutezici:** Zarybnicky Jakub, Hegerova Veronika
- **Soutez:** MCR Dospeli O LAT`,
  },
  {
    title: 'Oznameni o zaplaceni dlouhodobeho hostovani',
    publishedAt: '/ PO 23. 2. 2026 / 16:37',
    markdown: `Oznamujeme Vam, ze bylo zaplaceno nize uvedene dlouhodobe hostovani:

- **Clen:** Zarybnicky Jakub
- **Hostovani z:** Infinity Dance Team
- **Hostovani do:** DSP Kometa Brno
- **Od data:** 17. 2. 2026
- **Do data:** 31. 12. 2026`,
  },
];

export default function AnnouncementsScreen() {
  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={announcements}
      keyExtractor={(item) => `${item.title}-${item.publishedAt}`}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.kicker}>Aktuality</Text>
          <Text style={styles.subtitle}>
            Informacni servis klubu s dulezitymi oznameni, zmenami a administrativnimi udalostmi.
          </Text>
        </View>
      }
      renderItem={({ item }) => <AnnouncementCard {...item} />}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 18,
  },
  kicker: {
    color: '#394150',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#778091',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
});
