import { ErrorCodes } from 'src/constants/error-codes';
import { DomainException } from './domain.exception';

export class CountryCodesNotFoundException extends DomainException {
  readonly code = ErrorCodes.COUNTRY_CODES_NOT_FOUND;

  constructor(message: string) {
    super(message);
  }
}
