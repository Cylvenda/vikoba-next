import { type Control, Controller, type FieldValues, type FieldPath } from 'react-hook-form'
import { Card, CardContent } from '../ui/card'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet, FieldTitle, } from '../ui/field'
import { Input } from '../ui/input'
import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
} from "@/components/ui/select"
import { Eye, EyeClosed } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

type FormInputProps = {
     title?: string
     description?: string
     className?: string
     children: React.ReactNode
}

export const FormInput = ({
     title,
     description,
     children,
     className,
}: FormInputProps): React.ReactElement => {
     return (
          <Card className={`border-0 shadow-none ring-0 ${className}`}>
               <CardContent className="border-0 shadow-none ring-0 p-0">
                    <FieldGroup className="border-0 shadow-none ring-0">
                         <FieldSet className="border-0 shadow-none ring-0">
                              {title && (
                                   <FieldTitle className="text-xl font-bold">
                                        {title}
                                   </FieldTitle>
                              )}

                              {description && (
                                   <FieldDescription className="-mt-2">
                                        {description}
                                   </FieldDescription>
                              )}

                              <FieldContent className="border-0 shadow-none ring-0">
                                   {children}
                              </FieldContent>
                         </FieldSet>
                    </FieldGroup>
               </CardContent>
          </Card>
     )
}

type FieldInputProps<T extends FieldValues> = {
     type: string,
     label?: string,
     name: FieldPath<T>,
     placeholder?: string,
     value?: string | number,
     id?: string,
     required?: boolean,
     error?: string

     control: Control<T>
}

export const FieldInput = <T extends FieldValues>({
     label,
     name,
     type,
     placeholder,
     id,
     required,
     control,
}: FieldInputProps<T>): React.ReactElement => {
     return (
          <Controller
               name={name}
               control={control}
               render={({ field, fieldState }) => (
                    <Field className="space-y-2" data-invalid={fieldState.invalid}>
                         <FieldLabel htmlFor={name}>{label}</FieldLabel>

                         <Input
                              {...field}
                              id={id}
                              type={type}
                              placeholder={placeholder}
                              required={required}
                              autoComplete={name}
                              aria-invalid={fieldState.invalid}
                              className="focus-visible:ring-2 focus-visible:ring-blue-500 p-5 "
                         />

                         {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                         )}
                    </Field>
               )}
          />
     )
}

type FieldPasswordProps<T extends FieldValues> = {
     label?: string,
     placeholder?: string,
     id?: string,
     control: Control<T>
     name: FieldPath<T>,
     forgetPassword?: {
          text?: string,
          location?: string
     }
}

export const PasswordInput = <T extends FieldValues>({ label, name, placeholder, id, control, forgetPassword }: FieldPasswordProps<T>): React.ReactElement => {

     const [show, setShow] = useState<boolean>(false)

     const type = show ? "text" : "password"

     return (
          <Controller
               name={name}
               control={control}
               render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                         <FieldLabel className='flex flex-row justify-between' htmlFor={name}>
                              {label}
                              {forgetPassword?.text && forgetPassword?.location && (
                                   <Link href={forgetPassword.location} className='font-light text-chart-3 hover:underline'>
                                        {forgetPassword.text}
                                   </Link>
                              )}
                         </FieldLabel>
                         <div className='flex flex-row justify-between items-center gap-1 '>
                              <Input
                                   {...field}
                                   id={id}
                                   type={type}
                                   placeholder={placeholder}
                                   aria-invalid={fieldState.invalid}
                                   className="p-5 focus-visible:border-chart-3 focus-visible:ring-2 focus-visible:ring-chart-3/40"
                              />

                              <span className='cursor-pointer rounded-2xl border border-input bg-background p-2'>
                                   {
                                        show ?
                                             <EyeClosed onClick={() => setShow(false)} />
                                             :
                                             <Eye onClick={() => setShow(true)} />
                                   }
                              </span>
                         </div>
                         {fieldState.invalid && (<FieldError errors={[fieldState.error]} />)}

                    </Field>
               )}
          />
     )
}

type optionType = {
     value: string,
     label: string,
     default?: boolean
}
type FieldSelectProps<T extends FieldValues> = {
     label: string,
     options: optionType[]
     placeHolder: string,
     name: FieldPath<T>,
     control: Control<T>,
     onValueChange?: (value: string) => void
}

export const FieldSelect = <T extends FieldValues>({ label, name, options, control, placeHolder, onValueChange, }: FieldSelectProps<T>): React.ReactElement => {

     const defaultValue = options?.find((option: optionType) => option.default)?.value;

     return (
          <Controller
               name={name}
               control={control}
               render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                         <FieldLabel>{label}</FieldLabel>
                         <Select
                              defaultValue={defaultValue}
                              value={field.value}
                              onValueChange={(value) => {
                                   field.onChange(value)      // update react-hook-form state
                                   onValueChange?.(value)     // call parent callback if provided
                              }}
                         >
                              <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500">
                                   <SelectValue placeholder={placeHolder} />
                              </SelectTrigger>
                              <SelectContent>
                                   {options?.map((option: optionType) => (
                                        <SelectItem key={option.value} value={option.value} >
                                             {option.label}
                                        </SelectItem>
                                   ))}
                              </SelectContent>

                         </Select>
                         {fieldState.invalid && (<FieldError errors={[fieldState.error]} />)}
                    </Field>
               )}

          />
     )
}
