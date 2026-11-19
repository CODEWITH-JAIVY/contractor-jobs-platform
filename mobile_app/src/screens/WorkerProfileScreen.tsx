import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkerProfileForm } from '../components/WorkerProfileForm';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkerProfile'>;

/** Menu se profile badalna (setup wala hi form). */
export default function WorkerProfileScreen({ navigation }: Props) {
  return <WorkerProfileForm mode="edit" onSaved={() => navigation.goBack()} />;
}
