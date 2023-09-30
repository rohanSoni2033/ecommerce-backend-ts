export enum responseStatus {
  SUCCESS = 'success',
  FAIL = 'fail',
}

export enum statusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  REQUEST_TIMEOUT = 408,
  TOO_MANY_REQUESTS = 429,
}

export enum collections {
  PRODUCTS = 'products',
  USERS = 'users',
}

export enum UserTypes {
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  ADMIN = 'admin',
}
