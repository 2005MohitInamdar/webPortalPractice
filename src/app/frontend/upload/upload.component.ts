import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { FileStorageService } from '../service/file-storage.service';
import { Router } from '@angular/router'; 
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {
  selectedFiles: File[] = [];
  private platformID = inject(PLATFORM_ID);
  private fileStorageService = inject(FileStorageService);
  private filesSubscription?: Subscription;
  private router = inject(Router);


  ngOnInit() {
    // Subscribe to the files from the service
    this.filesSubscription = this.fileStorageService.files$.subscribe(files => {
      this.selectedFiles = files;
    });
  }

  ngOnDestroy() {
    this.filesSubscription?.unsubscribe();
  }

  supportsFolderUpload(): boolean {
    if (isPlatformBrowser(this.platformID)) {
      // webkitdirectory enables google browser to interact(open/close/read contents of it) with uploaded files/folders
      return 'webkitdirectory' in document.createElement('input');
    }
    return false;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    const items = event.dataTransfer?.items;
    if (!items) return;

    const traversePromises: Promise<File[]>[] = [];
    const fallbackFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (typeof item.webkitGetAsEntry === 'function') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          traversePromises.push(this.traverseFileTree(entry));
        }
      } else {
        const file = item.getAsFile?.();
        if (
          file &&
          (file.name.toLowerCase().endsWith('.pdf') ||
           file.name.toLowerCase().endsWith('.doc') ||
           file.name.toLowerCase().endsWith('.docx'))
        ) {
          fallbackFiles.push(file);
        }
      }
    }

    Promise.all(traversePromises).then(fileArrays => {
      const allFiles = fileArrays.flat();
      const pdfFiles = [...allFiles, ...fallbackFiles].filter(file =>
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.doc') || 
        file.name.toLowerCase().endsWith('.docx')
      );

      this.fileStorageService.addFiles(pdfFiles);
    });
  }

  traverseFileTree(item: any): Promise<File[]> {
    return new Promise(resolve => {
      if (item.isFile) {
        item.file((file: File) => resolve([file]));
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries((entries: any[]) => {
          const promises = entries.map(entry => this.traverseFileTree(entry));
          Promise.all(promises).then(results => {
            resolve(results.flat());
          });
        });
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const pdfFiles = files.filter(file =>
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.name.toLowerCase().endsWith('.docx')
      );

      this.fileStorageService.addFiles(pdfFiles);
    }
  }

  onSubmit() {
    alert(`${this.selectedFiles.length} PDF files ready.`);
    console.log(this.selectedFiles);
     this.router.navigate(['/filter']);
  }
}
