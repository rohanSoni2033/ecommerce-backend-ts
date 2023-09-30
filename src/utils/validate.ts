// interface ValidationError {
//   fieldName: string;
//   message: string;
// }s

// class Field {
//   public parentObj: any;
//   public fieldName: string;

//   constructor(parentObj: any, fieldName: string) {
//     this.parentObj = parentObj;
//     this.fieldName = fieldName;
//   }
// }

// class Property {
//   private mainObject: any;
//   private currentField: Field | null;
//   public errors: ValidationError[];
//   public data: any;

//   constructor(mainObject: any) {
//     this.mainObject = mainObject;
//     this.currentField = null;
//     this.errors = [];
//     this.data = {};
//   }

//   field(fieldName: string): Property {
//     this.currentField = new Field(this.mainObject, fieldName);
//     const obj = this.currentField!!.parentObj;

//     if (
//       typeof obj[fieldName] !== 'undefined' &&
//       obj[fieldName] !== null &&
//       obj[fieldName] !== ''
//     ) {
//       this.data[fieldName] = this.mainObject[fieldName];
//     }
//     return this;
//   }

//   child(fieldName: string): Property {
//     if (!this.currentField) return this;

//     if (typeof this.currentField === 'object') {
//       this.currentField = new Field(
//         this.currentField.parentObj[this.currentField.fieldName],
//         fieldName
//       );
//     }
//     return this;
//   }

//   required(message: string): Property {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (obj[fieldName] === null || obj[fieldName] === '') {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//     return this;
//   }

//   check(regex: RegExp, message: string): Property {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (
//       typeof obj[fieldName] === 'undefined' ||
//       obj[fieldName] === null ||
//       obj[fieldName] === ''
//     )
//       return this;
//     if (!obj[fieldName].match(regex)) {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//     return this;
//   }

//   equalTo(values: any[], message: string): Property {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (!Array.isArray(values)) return this;
//     if (!values.includes(obj[fieldName])) {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//     return this;
//   }

//   private checkType(type: string, message: string) {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (typeof obj[fieldName] === 'undefined' || obj[fieldName] === null)
//       return;
//     if (typeof obj[fieldName] !== type) {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//   }

//   isNumber(message: string): Property {
//     this.checkType('number', message);
//     return this;
//   }

//   isString(message: string): Property {
//     this.checkType('string', message);
//     return this;
//   }

//   isBoolean(message: string): Property {
//     this.checkType('boolean', message);
//     return this;
//   }

//   isArray(message: string): Property {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (typeof obj[fieldName] === 'undefined' || obj[fieldName] === null)
//       return this;
//     if (!Array.isArray(obj[fieldName])) {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//     return this;
//   }

//   isArrayEmpty(message: string): Property {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (!Array.isArray(obj[fieldName])) return this;

//     if (!(obj[fieldName].length > 0)) {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//     return this;
//   }

//   isDate(message: string): Property {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (typeof obj[fieldName] === 'undefined' || obj[fieldName] === null)
//       return this;
//     if (new Date(obj[fieldName]).toString() === 'Invalid Date') {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//     return this;
//   }

//   isObject(message: string): Property {
//     this.checkType('object', message);
//     return this;
//   }

//   validate(callback: (value: any) => boolean, message: string): Property {
//     const fieldName = this.currentField!!.fieldName;
//     const obj = this.currentField!!.parentObj;

//     if (typeof obj[fieldName] === 'undefined' || obj[fieldName] === null)
//       return this;

//     const result = callback(obj[fieldName]);
//     if (!result) {
//       this.errors.push({
//         fieldName,
//         message,
//       });
//     }
//     return this;
//   }
// }

// export default class Validate {
//   private obj: any;

//   constructor(obj: any) {
//     this.obj = obj;
//   }

//   field(fieldName: string) {
//     return new Property(this.obj).field(fieldName);
//   }
// }

interface ValidationError {
  field: string;
  message: string;
}

class Property {
  private obj: any;
  public errors: ValidationError[];
  public data: any;
  private currentField?: string;

  constructor(obj: any) {
    this.obj = obj;
    this.errors = [];
    this.data = {};
    this.currentField = undefined;
  }

  field(fieldName: string): Property {
    this.currentField = fieldName;

    if (
      typeof this.obj[fieldName] !== 'undefined' &&
      this.obj[fieldName] !== null &&
      this.obj[fieldName] !== ''
    ) {
      this.data[fieldName] = this.obj[fieldName];
    }
    return this;
  }

  required(message: string): Property {
    const field = this.currentField!!;

    if (this.obj[field] === undefined) {
      this.errors.push({
        field,
        message,
      });
    }
    return this;
  }

  check(regex: RegExp, message: string): Property {
    const field = this.currentField!!;

    if (this.obj[field] === undefined) return this;

    if (!this.obj[field].match(regex)) {
      this.errors.push({
        field,
        message,
      });
    }
    return this;
  }

  equalTo(values: any[], message: string): Property {
    const field = this.currentField!!;
    if (!this.obj[field] === undefined) return this;

    if (!Array.isArray(values)) return this;
    if (!values.includes(this.obj[field])) {
      this.errors.push({
        field,
        message,
      });
    }
    return this;
  }

  contains() {}

  private checkType(type: string, message: string) {
    const field = this.currentField!!;
    if (this.obj[field] === undefined) return this;

    if (typeof this.obj[field] !== type) {
      this.errors.push({
        field,
        message,
      });
    }
  }

  isNumber(message: string): Property {
    this.checkType('number', message);
    return this;
  }

  isString(message: string): Property {
    this.checkType('string', message);
    return this;
  }

  isBoolean(message: string): Property {
    this.checkType('boolean', message);
    return this;
  }

  isArray(message: string): Property {
    const field = this.currentField!!;
    if (this.obj[field] === undefined) return this;

    if (!Array.isArray(this.obj[field])) {
      this.errors.push({
        field,
        message,
      });
    }
    return this;
  }

  isArrayEmpty(message: string): Property {
    const field = this.currentField!!;

    if (this.obj[field] === undefined) return this;
    if (!Array.isArray(this.obj[field])) return this;

    if (this.obj[field].length < 1) {
      this.errors.push({
        field,
        message,
      });
    }
    return this;
  }

  isDate(message: string): Property {
    const field = this.currentField!!;
    if (this.obj[field] === undefined) return this;

    if (new Date(this.obj[field]).toString() === 'Invalid Date') {
      this.errors.push({
        field,
        message,
      });
    }
    return this;
  }

  isObject(message: string): Property {
    this.checkType('object', message);
    return this;
  }

  validate(callback: (value: any) => boolean, message: string): Property {
    const field = this.currentField!!;
    if (this.obj[field] === undefined) return this;

    const result = callback(this.obj[field]);
    if (!result) {
      this.errors.push({
        field,
        message,
      });
    }
    return this;
  }
}

export default class Validate {
  private obj: any;

  constructor(obj: any) {
    this.obj = obj;
  }

  field(fieldName: string) {
    return new Property(this.obj).field(fieldName);
  }
}
