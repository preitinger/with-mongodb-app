
export interface Person {
    name: string,
    phone: string
}

export type PersonWithId = Person & {id: string}