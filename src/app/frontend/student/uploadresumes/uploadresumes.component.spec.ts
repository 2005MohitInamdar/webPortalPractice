import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadresumesComponent } from './uploadresumes.component';

describe('UploadresumesComponent', () => {
  let component: UploadresumesComponent;
  let fixture: ComponentFixture<UploadresumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadresumesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadresumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
