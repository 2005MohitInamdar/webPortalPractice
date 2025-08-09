import { Routes } from '@angular/router';
import { UploadComponent } from './frontend/upload/upload.component';
import { FilterComponent } from './frontend/filter/filter.component';
import { ViewComponent } from './frontend/view/view.component';
import { LoginComponent } from './frontend/login/login.component';
import { SendEmailComponent } from './frontend/send-email/send-email.component';
export const routes: Routes = [
    {path:'', component:UploadComponent},
    {path:'filter', component: FilterComponent},
    {path: 'view', component: ViewComponent},
    {path: 'login', component: LoginComponent},
    {path: 'email', component: SendEmailComponent}
];
