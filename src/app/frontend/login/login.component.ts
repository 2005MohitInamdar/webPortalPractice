import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, Validators,FormGroup, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  showPassword:boolean = false

  myForm!: FormGroup;
  constructor(private fb: FormBuilder){
  this.myForm = this.fb.group({
    emailid: ['', [Validators.required, Validators.email]],
    passWord: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(15)]]
  })
  }

  getError(controlName:string):string | null{
    const control = this.myForm.get(controlName)
    if(control  && control.touched && control.invalid){
      const fieldLabel = controlName === 'emailid'? 'Email': 'Password'
      if(control.errors?.['required']) return `${fieldLabel} field is required`
      if(control.errors?.['email']) return 'Enter a valid email address'
      if(control.errors?.['minlength']) return `Minimum length is ${control.errors['minlength'].requiredLength}`
      if(control.errors?.['maxlength']) return `Maximum length of the password should be ${control.errors['maxlength'].requiredLength}`
    }
    return null
  } 

  
  onSubmitForm(){
    
    const formValues = this.myForm.value; 
    console.log(`${formValues.emailid} has logged in`)
  }
  onLogin(){
    this.myForm.markAllAsTouched();
    if(this.myForm.valid){
      this.onSubmitForm()
      console.log("Form is submitted")
    }
  }
}
