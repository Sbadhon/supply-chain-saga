import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabsComponent } from './shared/tabs/tabs.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TabsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'supplyChainSaga_FE';
}
