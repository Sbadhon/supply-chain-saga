import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderCreateModalComponent } from './order-create-modal.component';

describe('OrderCreateModalComponent', () => {
  let component: OrderCreateModalComponent;
  let fixture: ComponentFixture<OrderCreateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCreateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderCreateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
