import type { Job } from '../types';

export type RootStackParamList = {
  Login: undefined;
  WorkerHome: undefined;
  ContractorHome: undefined;
  AdminHome: undefined;
  JobDetail: { job: Job };
  Contractor: { userId: number };
  Applicants: { jobId: number; title: string };
  WorkerProfile: undefined;
};

export type ContractorTabParamList = { MyJobs: undefined; PostJob: undefined; Profile: undefined };
