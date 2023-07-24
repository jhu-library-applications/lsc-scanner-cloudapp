import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { of } from 'rxjs';

import { ItemService } from './item.service';
import { Item } from './interfaces/item.interface';
import { ItemUpdate } from './interfaces/item_update.interface';
import { LocationCode } from './main/location_code_mapping';
describe('ItemService', () => {
  let service: ItemService;
  let restServiceSpy: jasmine.SpyObj<CloudAppRestService>;

  const mockItem: Item = {
    bib_data: {
      mms_id: 'mms_id',
      title: 'title'
    },
    holding_data: {
      holding_id: 'holding_id'
    },
    item_data: {
      pid: 'pid',
      storage_location_id: 'rmst01',
    }
  };

  const mockItemUpdate: ItemUpdate = {
    item: mockItem,
    rmstBarcodeForItems: 'rmst02',
    bigMoveMode: false,
    location: 'location',
    library: 'library',
    libraryDesc: 'libraryDesc',
    locationDesc: 'locationDesc'
  };

  beforeEach(() => {
    const restSpy = jasmine.createSpyObj('CloudAppRestService', ['call']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ItemService,
        { provide: CloudAppRestService, useValue: restSpy }
      ]
    });

    service = TestBed.inject(ItemService);
    restServiceSpy = TestBed.inject(CloudAppRestService) as jasmine.SpyObj<CloudAppRestService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getItemByBarcode should return item by barcode', () => {
    const expectedItem = mockItem

    restServiceSpy.call.and.returnValue(of(expectedItem));
    service.getItemByBarcode('barcode').subscribe(item => {
      expect(item).toEqual(mockItem);
    });
  });

  it('#updateItem should return the updated item', () => {
    const updatedItem = mockItem;
    updatedItem.item_data.storage_location_id = 'rmst02'

    restServiceSpy.call.and.returnValue(of(updatedItem));
    service.updateItem(mockItemUpdate).subscribe(item => {
      expect(item).toEqual(updatedItem);
    });
  });

  it('#scanInItem should scan in item correctly', () => {
    const scannedItem = mockItem;
    restServiceSpy.call.and.returnValue(of(scannedItem));
    service.scanInItem(mockItem, 'library', 'circDesk').subscribe(item => {
      expect(item).toEqual(scannedItem);
      expect(restServiceSpy.call).toHaveBeenCalledWith(jasmine.objectContaining({
        url: `/almaws/v1/bibs/${mockItem.bib_data.mms_id}/holdings/${mockItem.holding_data.holding_id}/items/${mockItem.item_data.pid}`,
        queryParams: { op: 'scan', library: 'library', circ_desk: 'circDesk', register_in_house_use: 'true' },
        method: HttpMethod.POST
      }));
    });
  });
});
