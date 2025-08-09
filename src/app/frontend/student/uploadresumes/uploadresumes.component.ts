import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FileStorageService } from '../../service/file-storage.service'; 
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-uploadresumes',
  standalone: true, 
  imports: [CommonModule, FormsModule],
  templateUrl: './uploadresumes.component.html',
  styleUrls: ['./uploadresumes.component.scss']
})
export class UploadresumesComponent {
  
  private platformID = inject(PLATFORM_ID);
  private fileStorageService = inject(FileStorageService);
  private filesSubscription?: Subscription;
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  supportsFolderUpload(): boolean {
    if (isPlatformBrowser(this.platformID)) {
      // webkitdirectory enables google browser to interact(open/close/read contents of it) with uploaded files/folders
      return 'webkitdirectory' in document.createElement('input');
    }
    return false;
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

}
