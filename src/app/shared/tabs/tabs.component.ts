import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TabModel } from './tabs.model';
import { TABS } from './tabs.model';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent implements OnInit {
  tabs: TabModel[] = TABS;
  selectedTab: TabModel | null = null;
  activeTab: string = '';

  ngOnInit(): void {
    this.selectedTab = this.tabs[0] || null;
    this.activeTab = this.selectedTab?.type ?? '';
  }

  setActiveTab(tabType: string): void {
    this.activeTab = tabType;
  }
}
