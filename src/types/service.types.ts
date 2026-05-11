export interface CreateUser {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export type UserResponse = Omit<CreateUser, 'password'>;
