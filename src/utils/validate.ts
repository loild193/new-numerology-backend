export function getEmailRegExp(): RegExp {
  // tslint:disable-next-line
  return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
}

export function isEmail(str: string): boolean {
  const re = getEmailRegExp()
  return re.test(str)
}
