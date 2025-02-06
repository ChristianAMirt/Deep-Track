import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoadingComponent } from './components/shared/loading/loading.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'callback', redirectTo: '' }, // Handles the '/callback' route
  { path: 'loading', component: LoadingComponent },
  { path: '**', redirectTo: 'loading' } // Redirect any unmatched routes to the root
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
