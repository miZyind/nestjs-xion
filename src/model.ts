export interface StandardResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface StandardList<T> {
  data: T[];
  count?: number;
  total: number;
  page?: number;
  pageCount?: number;
}

// https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html
export interface CognitoUserJWTPayload {
  sub: string; // UUID
  name: string;
  given_name: string;
  family_name: string;
  middle_name: string;
  nickname: string;
  preferred_username: string;
  profile: string;
  picture: string;
  website: string;
  email: string;
  email_verified: boolean;
  gender: 'female' | 'male';
  birthdate: string;
  zoneinfo: string;
  locale: string;
  phone_number: string;
  phone_number_verified: boolean;
  // https://openid.net/specs/openid-connect-core-1_0.html#AddressClaim
  address: { formatted: string };
}
