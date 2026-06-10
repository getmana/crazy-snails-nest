import { ErrorCodes } from 'src/constants/error-codes';

export class CountryCodesNotFoundException extends Error {
  static readonly code = ErrorCodes.COUNTRY_CODES_NOT_FOUND;

  constructor(message: string) {
    super(message);
    this.name = 'CountryCodesNotFoundException';
  }
}
