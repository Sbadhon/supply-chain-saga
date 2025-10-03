import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShippingCreateModalComponent } from './shipping-create-modal.component';

describe('ShippingCreateModalComponent', () => {
  let component: ShippingCreateModalComponent;
  let fixture: ComponentFixture<ShippingCreateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShippingCreateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShippingCreateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
