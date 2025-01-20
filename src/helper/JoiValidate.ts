import ErrorMessageEnum from '../utils/enum/errorMessage';
import { IError } from '../utils/interface/common';
export const JoiError = (error: any): IError => {
  const err: IError = {
    message: ErrorMessageEnum.SOMETHING_WENT_WRONG,
    error: []
  };
  err.error = [];
  error?.details?.forEach((element) => {
    err.error.push({
      message: element?.message,
      inputValue: element?.context?.value
    });
  });
  return err;
};


export const JoiValidate = (schema: any, values: any) => {
  const { value, error } = schema.validate(values);
  return { value, error };
};

