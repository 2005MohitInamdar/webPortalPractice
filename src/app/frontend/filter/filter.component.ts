import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FileStorageService } from '../service/file-storage.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})

export class FilterComponent {
  llmOutputData:any = null;
  private router = inject(Router);
  filteredForms!:FormGroup 
  pollingSub!: Subscription;
  constructor(private fb:FormBuilder, private fileStorageService: FileStorageService, private http: HttpClient){
  this.filteredForms = this.fb.group({
    minimumCGPA: [null, [Validators.min(0), Validators.max(10), Validators.pattern("^[0-9]+(\\.[0-9]+)?$")]],
    graduationYear: [null, Validators.pattern('^[0-9]+$')],
    mintwelthPercentage: [null, [Validators.min(0), Validators.max(100), Validators.pattern("^[0-9]+(\\.[0-9]+)?$")]],
    mintenthPercentage: [null, [Validators.min(0), Validators.max(100), Validators.pattern("^[0-9]+(\\.[0-9]+)?$")]],
    branches: [null],
    skills: [''],
    internshipRequirement: [null]
  })
}

getError(controlName:string):string | null{
  const controls = this.filteredForms.get(controlName)
  if(controls && controls.touched && controls.invalid){
    if(controls.errors?.['min']) return `Number cannot be less than ${controls.errors['min'].min}`
    if(controls.errors?.['max']) return `Number cannot be more than ${controls.errors['max'].max}`
    if(controls.errors?.['pattern']) return `Enter a valid number`
  }
  return null
}


startPollingLLMOutput(expectedCount: number) {
  let receivedCount = 0;
  // Let ViewComponent know how many to expect
  this.fileStorageService.updateResumeProgress(receivedCount, expectedCount);

  const poller = interval(3000); // every 3 seconds
  this.pollingSub = poller.subscribe(() => {
    this.http.get<any>('http://localhost:5000/api/llm-output').subscribe({
      next: (res) => {
        if (res && res.email && res.full_name) {
          console.log("✅ LLM Output Received:", res);
          this.fileStorageService.add_candidates([res]);
          receivedCount++;
          this.fileStorageService.updateResumeProgress(receivedCount, expectedCount); // 🔁 update progress


          if (receivedCount >= expectedCount) {
            console.log("✅ All candidates received");
            this.pollingSub.unsubscribe();
          }
        }
      },
      error: (err) => {
        console.error("Polling failed:", err);
      }
    });
  });
}


onSubmit() {
    const formValue = this.filteredForms.value;

    // Convert skills string to array
    const processedSkills = formValue.skills
      ? formValue.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const finalData = {
      ...formValue,
      skills: processedSkills,
    };

    // Store filters locally
    this.fileStorageService.applyFilters(finalData);
    console.log("Filters applied and stored:", finalData);

    // Get uploaded files from service
    const files = this.fileStorageService.getFiles();


     // Send filters ONCE to Flask backend
  this.http.post('http://localhost:5000/api/filters', finalData).subscribe({
    next: (res) => {
      console.log("Filters sent to backend:", res);
      this.uploadFilesSequentially(files); // ⏩ Upload files and then poll
    },
    error: (err) => {
      console.error("Failed to send filters:", err);
    }
  });
}
  

  uploadFilesSequentially(files: File[]) {
    this.router.navigate(['/view']);
    if (!files.length) {
    this.startPollingLLMOutput(files.length);
    return;
  } 

    let i = 0;
    const sendNext = () => {
      if (i >= files.length) {
      this.startPollingLLMOutput(files.length);
      return;
      }

      const file = files[i];
      const formData = new FormData();
      formData.append('file', file, file.name);

      this.http.post('http://localhost:5000/upload', formData).subscribe({
        next: (res) => {
          console.log(`File ${file.name} uploaded:`, res);
          i++;
          sendNext(); // Upload next file after response
        },
        error: (err) => {
          console.error(`Failed to upload ${file.name}:`, err);
          i++;
          sendNext(); // Optionally continue even if one fails
        }
      });
    };
    sendNext();
  }
}