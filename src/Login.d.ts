import { ReactNode } from 'react'

export interface LoginProps {
  productName?: string
  _logoSrc?: string
  authBase?: string
  icon?: ReactNode
  title?: string
  byLine?: string
  iconBg?: string
  iconColor?: string
  signupParams?: string
}

export default function Login(props: LoginProps): JSX.Element
