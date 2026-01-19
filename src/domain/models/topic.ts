export type Topic = {
  id: number;
  name: string;
  label: string;
  icon: string;
  tone: 'orange' | 'green' | 'purple' | 'blue';
  createdAt?: string;
};
