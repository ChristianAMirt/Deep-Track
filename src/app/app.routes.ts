import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoadingComponent } from './components/shared/loading/loading.component';
import { TableViewComponent } from './components/table-view/table-view.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'callback', redirectTo: '' }, // Handles the '/callback' route
  { path: 'loading', component: LoadingComponent },
  { path: 'table-view', component: TableViewComponent},
  { path: '**', component: LoadingComponent } // Redirect any unmatched routes to the root
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
