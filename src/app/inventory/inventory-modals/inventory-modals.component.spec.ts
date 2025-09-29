import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryModalsComponent } from './inventory-modals.component';

describe('InventoryModalsComponent', () => {
  let component: InventoryModalsComponent;
  let fixture: ComponentFixture<InventoryModalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryModalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryModalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
