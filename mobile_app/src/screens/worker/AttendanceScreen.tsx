import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { api, errText } from '../../api';
import { BigButton, BottomSheet, EmptyState, Field, IconName, SectionTitle, confirm, toast } from '../../components/ui';
import { monthNames, useT, weekdayNames } from '../../i18n';
import { C, fmtHours, inr, ymKey, ymd } from '../../theme';
import type { AttendanceEntry, AttendanceSettings, AttendanceStatus, AttendanceSummary, Payment } from '../../types';

/** Worker ka apna private hisaab: hazri + overtime + paisa mila + kamai. */
export default function AttendanceScreen() {
  const { t } = useT();
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [sum, setSum] = useState<AttendanceSummary | null>(null);
  const [settings, setSettings] = useState<AttendanceSettings>({ dailyWage: null, overtimeRate: null });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dayOpen, setDayOpen] = useState<Date | null>(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const m = ymKey(month);

  const load = useCallback(async () => {
    try {
      const [e, s, st, p] = await Promise.all([
        api.get<AttendanceEntry[]>('/attendance', { month: m }),
        api.get<AttendanceSummary>('/attendance/summary', { month: m }),
        api.get<AttendanceSettings>('/attendance/settings'),
        api.get<Payment[]>('/attendance/payments', { month: m }),
      ]);
      setEntries(Object.fromEntries(e.map((x) => [x.date, x])));
      setSum(s);
      setSettings(st);
      setPayments(p);
      setErr(null);
    } catch (e) {
      setErr(errText(e));
    }
    setLoading(false);
    setRefreshing(false);
  }, [m]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const shift = (d: number) => {
    setLoading(true);
    setMonth(new Date(month.getFullYear(), month.getMonth() + d, 1));
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isCurrent = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7; // Som se shuru
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const copySummary = async () => {
    if (!sum) return;
    const text =
      `${t('att.summaryTitle', { month: monthNames()[month.getMonth()], year: month.getFullYear() })}\n` +
      `${t('att.present')}: ${t('att.days', { n: sum.presentDays })}\n${t('att.half')}: ${sum.halfDays}\n${t('att.absent')}: ${sum.absentDays}\n` +
      `${t('att.overtime')}: ${sum.overtimeHours} ${t('att.hours')}\n${t('att.earn')}: ${inr(sum.totalAmount)}\n` +
      `${t('att.received')}: ${inr(sum.receivedThisMonth)}\n${t('att.totalBalance')}: ${inr(sum.balance)}`;
    await Clipboard.setStringAsync(text);
    toast(t('att.copied'));
  };

  const deletePayment = async (p: Payment) => {
    const ok = await confirm(t('att.removeTitle', { amt: inr(p.amount) }), '', t('att.removeYes'), true);
    if (!ok) return;
    try {
      await api.del(`/attendance/payments/${p.id}`);
      void load();
    } catch (e) {
      toast(errText(e));
    }
  };

  const cell = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const key = ymd(date);
    const e = entries[key];
    const future = date.getTime() > today.getTime();
    const isToday = key === ymd(today);
    let bg = '#fff';
    let bd: string = C.line;
    let mark: React.ReactNode = null;
    if (e?.status === 'PRESENT') {
      bg = C.lightGreen; bd = C.green;
      mark = <Ionicons name="checkmark" size={16} color={C.green} />;
    } else if (e?.status === 'HALF_DAY') {
      bg = C.paleYellow; bd = C.amber;
      mark = <Text style={{ fontSize: 15, fontWeight: '800', color: '#7A5B00' }}>½</Text>;
    } else if (e?.status === 'ABSENT') {
      bg = C.lightRed; bd = C.red;
      mark = <Ionicons name="close" size={16} color={C.red} />;
    }
    const ot = e ? Number(e.overtimeHours) : 0;
    return (
      <Pressable
        key={day}
        disabled={future}
        onPress={() => setDayOpen(date)}
        style={{
          flex: 1, aspectRatio: 0.8, margin: 3, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
          borderWidth: isToday ? 2 : 1, borderColor: isToday ? C.ink : bd,
        }}
      >
        <Text style={{ fontWeight: '700', fontSize: 15, color: future ? C.line : C.ink }}>{day}</Text>
        {mark}
        {ot > 0 ? <Text style={{ fontSize: 11, fontWeight: '700', color: C.ink }}>+{fmtHours(ot)}h</Text> : null}
      </Pressable>
    );
  };

  const stat = (label: string, value: string, color: string) => (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: C.steel, marginTop: 2 }}>{label}</Text>
    </View>
  );

  const legend = (bg: string, bd: string, t: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: bg, borderWidth: 1, borderColor: bd }} />
      <Text style={{ fontSize: 12, color: C.steel, marginLeft: 6 }}>{t}</Text>
    </View>
  );

  const balance = sum?.balance ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <Pressable onPress={() => shift(-1)} style={{ padding: 12 }}><Ionicons name="chevron-back" size={22} color={C.ink} /></Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: C.ink }}>{monthNames()[month.getMonth()]} {month.getFullYear()}</Text>
        <Pressable onPress={() => shift(1)} disabled={isCurrent} style={{ padding: 12, opacity: isCurrent ? 0.3 : 1 }}>
          <Ionicons name="chevron-forward" size={22} color={C.ink} />
        </Pressable>
        <Pressable onPress={() => setRateOpen(true)} style={{ padding: 12 }}><Ionicons name="options-outline" size={22} color={C.ink} /></Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1 }} />
      ) : err ? (
        <EmptyState
          icon="cloud-offline-outline"
          text={err}
          action={<Pressable onPress={() => void load()} style={{ padding: 12 }}><Text style={{ fontWeight: '700', color: C.ink }}>{t('common.retry')}</Text></Pressable>}
        />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} colors={[C.ink]} />}>
          <View style={{ backgroundColor: C.yellow, paddingTop: 12, paddingLeft: 16, paddingRight: 8, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '600', color: C.ink }}>{t('att.earnings')}</Text>
              <Pressable onPress={() => void copySummary()} style={{ padding: 8 }}><Ionicons name="copy-outline" size={20} color={C.ink} /></Pressable>
            </View>
            <Text style={{ fontSize: 36, fontWeight: '800', color: C.ink }}>{inr(sum?.totalAmount)}</Text>
            <Text style={{ fontSize: 13, color: C.ink, marginTop: 4 }}>
              {t('att.daysPay')}: {inr(sum?.daysAmount)}    {t('att.overtime')}: {inr(sum?.overtimeAmount)}
            </Text>
          </View>

          <View style={{ backgroundColor: '#fff', flexDirection: 'row', paddingVertical: 14 }}>
            {stat(t('att.present'), String(sum?.presentDays ?? 0), C.green)}
            {stat(t('att.half'), String(sum?.halfDays ?? 0), C.amber)}
            {stat(t('att.absent'), String(sum?.absentDays ?? 0), C.red)}
            {stat(t('att.overtime'), `${sum?.overtimeHours ?? 0}h`, C.ink)}
          </View>

          <View style={{ backgroundColor: '#fff', marginTop: 8, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingLeft: 16, paddingRight: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.steel, fontSize: 13 }}>{balance < 0 ? t('att.advance') : t('att.balance')}</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: balance < 0 ? C.red : C.ink }}>{inr(Math.abs(balance))}</Text>
            </View>
            <BigButton compact icon="add" label={t('att.addPay')} onPress={() => setPayOpen(true)} />
          </View>

          {settings.dailyWage == null ? (
            <Pressable onPress={() => setRateOpen(true)} style={{ backgroundColor: C.paleYellow, flexDirection: 'row', alignItems: 'center', padding: 16 }}>
              <Ionicons name="information-circle-outline" size={22} color={C.ink} />
              <Text style={{ flex: 1, marginHorizontal: 12, color: C.ink }}>{t('att.setWageBanner')}</Text>
              <Text style={{ fontWeight: '700', color: C.ink }}>{t('att.setNow')}</Text>
            </Pressable>
          ) : null}

          {isCurrent ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <BigButton icon="create-outline" label={t('att.markToday')} onPress={() => setDayOpen(today)} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', paddingHorizontal: 9, paddingTop: 16, paddingBottom: 6 }}>
            {weekdayNames().map((d) => (
              <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: C.steel, fontWeight: '600' }}>{d}</Text>
            ))}
          </View>
          <View style={{ paddingHorizontal: 9 }}>
            {weeks.map((w, i) => (
              <View key={i} style={{ flexDirection: 'row' }}>
                {w.map((d, j) => (d == null ? <View key={`b${j}`} style={{ flex: 1, margin: 3 }} /> : cell(d)))}
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 16 }}>
            {legend(C.lightGreen, C.green, t('att.present'))}
            {legend(C.paleYellow, C.amber, t('att.half'))}
            {legend(C.lightRed, C.red, t('att.absent'))}
          </View>

          {payments.length > 0 ? (
            <>
              <SectionTitle text={t('att.monthReceived', { amt: inr(sum?.receivedThisMonth) })} />
              {payments.map((p) => (
                <View key={p.id} style={{ backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.lightGreen, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="cash-outline" size={20} color={C.green} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink }}>{inr(p.amount)}</Text>
                    <Text style={{ color: C.steel, fontSize: 13 }}>{p.date}{p.note ? `  ${p.note}` : ''}</Text>
                  </View>
                  <Pressable onPress={() => void deletePayment(p)} hitSlop={10}><Ionicons name="trash-outline" size={20} color={C.steel} /></Pressable>
                </View>
              ))}
            </>
          ) : null}

          <Text style={{ color: C.steel, fontSize: 12, padding: 16, paddingBottom: 32 }}>{t('att.private')}</Text>
        </ScrollView>
      )}

      <DaySheet date={dayOpen} existing={dayOpen ? entries[ymd(dayOpen)] : undefined} onClose={() => setDayOpen(null)} onSaved={() => { setDayOpen(null); void load(); }} />
      <RateSheet visible={rateOpen} settings={settings} onClose={() => setRateOpen(false)} onSaved={() => { setRateOpen(false); void load(); }} />
      <PaymentSheet visible={payOpen} onClose={() => setPayOpen(false)} onSaved={() => { setPayOpen(false); void load(); }} />
    </View>
  );
}

function DaySheet({ date, existing, onClose, onSaved }: { date: Date | null; existing?: AttendanceEntry; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [ot, setOt] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const key = date ? ymd(date) : '';

  // sheet khulte hi purani entry se bharo
  React.useEffect(() => {
    if (!date) return;
    setStatus(existing?.status ?? 'PRESENT');
    setOt(existing ? Number(existing.overtimeHours) : 0);
    setNote(existing?.note ?? '');
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onSaved();
    } catch (e) {
      toast(errText(e));
      setBusy(false);
    }
  };

  const chip = (v: AttendanceStatus, label: string, icon: IconName) => {
    const sel = status === v;
    return (
      <Pressable
        key={v}
        onPress={() => setStatus(v)}
        style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: sel ? C.paleYellow : '#fff', borderWidth: sel ? 2 : 1, borderColor: sel ? C.ink : C.line }}
      >
        <Ionicons name={icon} size={24} color={C.ink} />
        <Text style={{ fontWeight: '600', fontSize: 13, marginTop: 4, color: C.ink }}>{label}</Text>
      </Pressable>
    );
  };

  const stepBtn = (icon: IconName, onPress: () => void, disabled: boolean) => (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.concrete, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
      <Ionicons name={icon} size={24} color={C.ink} />
    </Pressable>
  );

  return (
    <BottomSheet visible={date != null} onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {date ? (
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink, marginBottom: 14 }}>
              {weekdayNames()[(date.getDay() + 6) % 7]}, {date.getDate()} {monthNames()[date.getMonth()]} {date.getFullYear()}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {chip('PRESENT', t('att.present'), 'checkmark-circle-outline')}
            {chip('HALF_DAY', t('att.half'), 'time-outline')}
            {chip('ABSENT', t('att.absent'), 'close-circle-outline')}
          </View>
          {status !== 'ABSENT' ? (
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontWeight: '700', color: C.ink }}>{t('att.overtime')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 24 }}>
                {stepBtn('remove', () => setOt((v) => Math.max(0, v - 0.5)), ot <= 0)}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: C.ink }}>{fmtHours(ot)}</Text>
                  <Text style={{ color: C.steel }}>{t('att.hours')}</Text>
                </View>
                {stepBtn('add', () => setOt((v) => Math.min(16, v + 0.5)), ot >= 16)}
              </View>
            </View>
          ) : null}
          <View style={{ marginTop: 16 }}>
            <Field label={t('att.note')} value={note} onChangeText={setNote} maxLength={200} />
          </View>
          <BigButton
            label={busy ? t('common.wait') : t('common.save')}
            disabled={busy}
            onPress={() => void run(() => api.put(`/attendance/${key}`, { status, overtimeHours: status === 'ABSENT' ? 0 : ot, note: note.trim() }))}
          />
          {existing ? (
            <Pressable onPress={() => void run(() => api.del(`/attendance/${key}`))} disabled={busy} style={{ alignItems: 'center', padding: 14 }}>
              <Text style={{ color: C.red, fontWeight: '600' }}>{t('att.removeDay')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

function RateSheet({ visible, settings, onClose, onSaved }: { visible: boolean; settings: AttendanceSettings; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const [wage, setWage] = useState('');
  const [rate, setRate] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setWage(settings.dailyWage != null ? String(settings.dailyWage) : '');
    setRate(settings.overtimeRate != null ? String(settings.overtimeRate) : '');
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const save = async () => {
    setBusy(true);
    try {
      const w = parseInt(wage, 10);
      const r = parseInt(rate, 10);
      await api.put('/attendance/settings', { dailyWage: Number.isNaN(w) ? null : w, overtimeRate: Number.isNaN(r) ? null : r });
      onSaved();
    } catch (e) {
      toast(errText(e));
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink, marginBottom: 14 }}>{t('att.rateTitle')}</Text>
        <Field label={t('att.dailyWage')} value={wage} onChangeText={setWage} keyboardType="number-pad" />
        <Field label={t('att.otRate')} value={rate} onChangeText={setRate} keyboardType="number-pad" />
        <Text style={{ color: C.steel, fontSize: 12, marginBottom: 14 }}>{t('att.rateNote')}</Text>
        <BigButton label={busy ? t('common.wait') : t('common.save')} onPress={save} disabled={busy} />
      </ScrollView>
    </BottomSheet>
  );
}

function PaymentSheet({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setAmount('');
    setNote('');
    setDate(new Date());
    setBusy(false);
  }, [visible]);

  const pickDate = () => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      maximumDate: new Date(),
      onChange: (_e, d) => {
        if (d) setDate(d);
      },
    });
  };

  const save = async () => {
    const amt = parseInt(amount, 10);
    if (Number.isNaN(amt) || amt <= 0) {
      toast(t('att.payInvalid'));
      return;
    }
    setBusy(true);
    try {
      await api.post('/attendance/payments', { date: ymd(date), amount: amt, note: note.trim() });
      onSaved();
    } catch (e) {
      toast(errText(e));
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink, marginBottom: 14 }}>{t('att.payTitle')}</Text>
        <Field label={t('att.payAmount')} value={amount} onChangeText={setAmount} keyboardType="number-pad" />
        <Field label={t('att.payNote')} value={note} onChangeText={setNote} />
        <View style={{ marginBottom: 14 }}>
          <BigButton outlined icon="calendar-outline" label={`${date.getDate()} ${monthNames()[date.getMonth()]} ${date.getFullYear()}`} onPress={pickDate} />
        </View>
        <BigButton label={busy ? t('common.wait') : t('common.save')} onPress={save} disabled={busy} />
      </ScrollView>
    </BottomSheet>
  );
}
