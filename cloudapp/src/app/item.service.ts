import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable } from 'rxjs';
import { Item } from './interfaces/item.interface';
import { ItemUpdate } from './interfaces/item_update.interface';
import { HoldingService } from './holding.service';


@Injectable({
  providedIn: 'root'
})
export class ItemService {
  constructor(private restService: CloudAppRestService, private holdingService: HoldingService) { }

  getItemByBarcode(barcode: string): Observable<Item> {
    const request: Request = {
      url: `/almaws/v1/items?item_barcode=${barcode}`,
      method: HttpMethod.GET
    };
    return this.restService.call(request);
  }

  scanInItem(item: Item, library: string, circDesk: string): Observable<Item> {

    const scanInRequest: Request = {
      url: `/almaws/v1/bibs/${item.bib_data.mms_id}/holdings/${item.holding_data.holding_id}/items/${item.item_data.pid}`,
      queryParams: { op: 'scan', library: library, circ_desk: circDesk, register_in_house_use: 'true' },
      method: HttpMethod.POST
    };

    return this.restService.call(scanInRequest)
  }

  updateItem(itemUpdate: ItemUpdate): Observable<Item> {
    itemUpdate.item.item_data.storage_location_id = itemUpdate.rmstBarcodeForItems;

    // Change the status of the item from in-process to available
    itemUpdate.item.item_data.internal_note_1 = '';

    if (itemUpdate.bigMoveMode) {
      this.holdingService.updateHoldingsRecord(itemUpdate).subscribe({
        next: holding => {
          console.log("Holding updated")
          console.log(holding);
        },
        error: err => {
          console.log(err);
        } 
        
      });
    }

    const request: Request = {
      url: `/almaws/v1/bibs/${itemUpdate.item.bib_data.mms_id}/holdings/${itemUpdate.item.holding_data.holding_id}/items/${itemUpdate.item.item_data.pid}`,
      method: HttpMethod.PUT,
      requestBody: itemUpdate.item
    };

    return this.restService.call(request);
  }
}