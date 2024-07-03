//@ts-nocheck
import { MoleculerErrors as Errors } from 'msq-moleculer-core';
import { MISSING_SERVICE_PRIVATE_KEY } from '~common';

/**
 * Unhandled exception.
 */
export class UnhandledError extends Errors.MoleculerError {
  constructor(err) {
    super(`Unhandled exception ${err}`, 500, 'INTERNAL_ERROR');
  }
}

export class UnrecognizedEvent extends Errors.MoleculerError {
  constructor(event) {
    super(`Unrecognized event "${event}"`, 500, 'INTERNAL_ERROR');
  }
}

export class MissingServicePrivateKey extends Errors.MoleculerError {
  constructor() {
    super(MISSING_SERVICE_PRIVATE_KEY, 500, 'INTERNAL_ERROR');
  }
}

export class NotFound extends Errors.MoleculerError {
  constructor() {
    super(`Not found`, 404, 'NOT_FOUND');
  }
}
