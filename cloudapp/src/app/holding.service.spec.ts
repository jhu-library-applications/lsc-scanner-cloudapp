import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { HoldingService } from './holding.service';
import { ItemUpdate } from './interfaces/item_update.interface';
import { locationCodeMapping } from './main/location_code_mapping';

describe('HoldingService', () => {
  let service: HoldingService;
  let restService: CloudAppRestService;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CloudAppRestService', ['call']);

    TestBed.configureTestingModule({
      providers: [
        HoldingService,
        { provide: CloudAppRestService, useValue: spy }
      ]
    });

    restService = TestBed.inject(CloudAppRestService);  
    service = TestBed.inject(HoldingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update holdings record', () => {
    const itemUpdate: ItemUpdate = {
      item: {
        bib_data: {
          title: 'Test Title',
          mms_id: '123'
        },
        holding_data:
          { holding_id: '456' }
      },
      library: 'elsc',
      location: '2305open',
      rmstBarcodeForItems: 'rmst01',
      bigMoveMode: false,
      libraryDesc: 'offsite storage',
      locationDesc: 'offsite storage',
      locationCodeMapping: locationCodeMapping
    };

    const holdingsRequest: Request = {
      url: `/almaws/v1/bibs/${itemUpdate.item.bib_data.mms_id}/holdings/${itemUpdate.item.holding_data.holding_id}`,
      method: HttpMethod.GET,
      headers: {
        Accept: "application/xml"
      }
    };

    const holdingMock = '<root><datafield tag="852"><subfield code="b">LSC</subfield><subfield code="c">shmoffs</subfield></datafield></root>';

    spyOn(restService, 'call').and.returnValue(of(itemUpdate.item));  // spyOn goes first

    restService.call(holdingsRequest).subscribe(
      holding => {
        console.log(holding);
      });
  
    service.updateHoldingsRecord(itemUpdate).subscribe(result => {
      expect(result).toBeTruthy();
    });
  });
});
