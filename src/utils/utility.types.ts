/* eslint-disable prettier/prettier */
export type Drop<TSource, TKeys extends keyof TSource> = Omit<TSource, TKeys>;

export type Optional<T extends Record<string, any>, K extends keyof T> = Omit<
  T,
  K
> &
  Partial<Pick<T, K>>;

export type TObject = Record<string, any>;

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Unionize<T extends TObject> = {
  [P in keyof T]: { [Q in P]: T[P] };
}[keyof T];

export type Shape<T extends TObject> = Partial<T>;