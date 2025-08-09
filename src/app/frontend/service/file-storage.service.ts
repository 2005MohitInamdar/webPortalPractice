import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileStorageService {
  private candidatesSubject = new BehaviorSubject<any[]>([]);
  candidates$ = this.candidatesSubject.asObservable();
  private filtersSubject = new BehaviorSubject<any>(null);
  filters$ = this.filtersSubject.asObservable();

  candidates:any = []

  constructor() { }
  // always stores the latest value passed eg: checking logged in status of users and send status throughout all components
  private filesSubject = new BehaviorSubject<File[]>([]);
  files$: Observable<File[]> = this.filesSubject.asObservable();

  getFiles(): File[] {
    return this.filesSubject.getValue();
  }

  addFiles(newFiles: File[]) {
    const existingFileNames = new Set(this.filesSubject.getValue().map(f => f.name));
    const filteredNewFiles = newFiles.filter(f => !existingFileNames.has(f.name));
    this.filesSubject.next([...this.filesSubject.getValue(), ...filteredNewFiles]);
  }

  clearFiles() {
    this.filesSubject.next([]);
  }

  applyFilters(filters: any) {
    this.filtersSubject.next(filters);
  }

  getFilters(): any {
    return this.filtersSubject.getValue();
  }


  add_candidates(students: any[]) {
  console.log("Adding student");
  const updated = [...this.candidates, ...students];
  this.candidates = updated;
  this.candidatesSubject.next(updated);
  console.log("ADDED SUCCESSFULLY");
}
  
  show_candidates(){
    console.log("Showing candidates")
    if(this.candidates.length<1){
      console.log("Add candidates to show data")
      return [];
    }
    else{
      console.log("Showing candidates SUCCESSFUL")
      return this.candidates
    }
  }

  private resumeProgressSubject = new BehaviorSubject<{ received: number, total: number }>({ received: 0, total: 0 });
resumeProgress$ = this.resumeProgressSubject.asObservable();

updateResumeProgress(received: number, total: number) {
  this.resumeProgressSubject.next({ received, total });
}

}
