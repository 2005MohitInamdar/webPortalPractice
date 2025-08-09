import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileStorageService } from '../service/file-storage.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
@Component({
  selector: 'app-view',
  standalone: true, 
  imports: [CommonModule],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})
  export class ViewComponent {
    // today = Date.now();

    
    private router = inject(Router)
    candidates:any = []
    count:number = 0

    receivedCount = 0;
  totalFiles = 1; // default value
  isLoading = false;
    constructor(private fileStorageService: FileStorageService, private http: HttpClient){
    
    this.fileStorageService.candidates$.subscribe((data) => {
    this.candidates = data;
    console.log("Updated candidates in view:", this.candidates);
  });

  this.fileStorageService.resumeProgress$.subscribe(progress => {
      this.receivedCount = progress.received;
      this.totalFiles = progress.total;
      this.isLoading = this.receivedCount < this.totalFiles;
    });
  }
  
      sendEmail(){
      this.router.navigate(['/email'])
      this.http.post('http://localhost:5000/api/sendEmail', this.candidates).subscribe({
        next: (res) => {
          console.log("Data send to backend", res)
        }, 
        error: (err) => {
          console.log("ERROR FOUND IN FRONTEND")
        }
      })
  }  
   
}
