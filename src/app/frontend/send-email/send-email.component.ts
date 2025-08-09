import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-send-email',
  standalone: true, 
  imports: [],
  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.scss'
})
export class SendEmailComponent {
  private http = inject(HttpClient)
  start_sending_emails:boolean = false
  sendit(){
    this.start_sending_emails = true
    this.http.post('http://localhost:5000/api/now_sending', this.start_sending_emails).subscribe({
      next: (res) => {
        console.log("Started: ", res)
        this.start_sending_emails = false
      },
      error: (err) => {
        console.log("Error", err)
        this.start_sending_emails = false
      }
    })
  }
}
