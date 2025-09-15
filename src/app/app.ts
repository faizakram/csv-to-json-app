import { Component } from '@angular/core';
import { FileUploadComponent } from './file-upload/file-upload';

@Component({
  selector: 'app-root',
  imports: [FileUploadComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'csv-to-json-app';
}
