import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, errText } from '../api';
import { useT } from '../i18n';
import { AdBanner } from '../native/ads';
import { C } from '../theme';
import { EmptyState, IconName } from './ui';

type Props<T> = {
  path: string;
  query?: Record<string, string>;
  keyOf: (item: T) => string | number;
  renderItem: (item: T, reload: () => void) => React.ReactElement;
  empty?: string;
  emptyIcon?: IconName;
  adEvery?: number; // 0 = ad nahi; 5 = har 5 items ke baad banner
  header?: React.ReactElement;
};

type Row<T> = { kind: 'item'; key: string; item: T } | { kind: 'ad'; key: string };

/** Kisi bhi list API (Page ya List). Pull-to-refresh, infinite scroll, focus par silent refresh, ads. */
export function ApiList<T>({ path, query, keyOf, renderItem, empty, emptyIcon = 'file-tray-outline', adEvery = 0, header }: Props<T>) {
  const { t, lang } = useT();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const meta = useRef({ page: 0, last: true, busy: false });
  const firstFocus = useRef(true);
  const queryKey = JSON.stringify(query ?? {});

  const fetchPage = useCallback(
    async (page: number): Promise<{ items: T[]; last: boolean }> => {
      const d = await api.get<T[] | { content: T[]; last?: boolean }>(path, { ...query, page });
      if (Array.isArray(d)) return { items: d, last: true };
      return { items: d.content, last: d.last !== false };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path, queryKey],
  );

  const loadFirst = useCallback(
    async (mode: 'spinner' | 'refresh' | 'silent') => {
      if (mode === 'spinner') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        const r = await fetchPage(0);
        setItems(r.items);
        meta.current = { page: 0, last: r.last, busy: false };
        setErr(null);
      } catch (e) {
        setErr(errText(e));
      }
      setLoading(false);
      setRefreshing(false);
    },
    [fetchPage],
  );

  useEffect(() => {
    void loadFirst('spinner');
  }, [loadFirst]);

  // tab/screen par wapas aane par chupke se refresh
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void loadFirst('silent');
    }, [loadFirst]),
  );

  const reload = useCallback(() => void loadFirst('silent'), [loadFirst]);

  const loadMore = useCallback(async () => {
    const m = meta.current;
    if (m.last || m.busy) return;
    m.busy = true;
    setMore(true);
    try {
      const r = await fetchPage(m.page + 1);
      setItems((prev) => [...prev, ...r.items]);
      meta.current = { page: m.page + 1, last: r.last, busy: false };
    } catch {
      meta.current.busy = false; // agli scroll par dobara try
    }
    setMore(false);
  }, [fetchPage]);

  const rows = useMemo<Row<T>[]>(() => {
    const out: Row<T>[] = [];
    items.forEach((item, i) => {
      out.push({ kind: 'item', key: `i-${keyOf(item)}`, item });
      if (adEvery > 0 && (i + 1) % adEvery === 0) out.push({ kind: 'ad', key: `ad-${i}` });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, adEvery]);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={C.ink} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.key}
      ListHeaderComponent={header}
      extraData={lang}
      renderItem={({ item: r }) =>
        r.kind === 'ad' ? <AdBanner /> : <View style={{ backgroundColor: '#fff' }}>{renderItem(r.item, reload)}</View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.line }} />}
      ListEmptyComponent={
        err ? (
          <EmptyState
            icon="cloud-offline-outline"
            text={err}
            action={
              <Pressable onPress={() => void loadFirst('spinner')} style={{ padding: 12 }}>
                <Text style={{ fontWeight: '700', color: C.ink }}>{t('common.retry')}</Text>
              </Pressable>
            }
          />
        ) : (
          <EmptyState icon={emptyIcon} text={empty ?? t('common.empty')} />
        )
      }
      ListFooterComponent={more ? <ActivityIndicator color={C.ink} style={{ padding: 16 }} /> : undefined}
      onEndReached={() => void loadMore()}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadFirst('refresh')} colors={[C.ink]} />}
      contentContainerStyle={{ flexGrow: 1 }}
    />
  );
}
