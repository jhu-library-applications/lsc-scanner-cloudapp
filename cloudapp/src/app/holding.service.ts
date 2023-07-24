import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { ItemUpdate } from './interfaces/item_update.interface';
import { locationCodeMapping } from './main/location_code_mapping';
import { Observable } from 'rxjs/internal/Observable';
import { Item } from './interfaces/item.interface';

@Injectable({
  providedIn: 'root'
})

export class HoldingService {

  constructor(private restService: CloudAppRestService) { }

  updateHoldingsRecord(itemUpdate: ItemUpdate): Observable<Item> {
    const item = itemUpdate.item

    const holdingsRequest: Request = {
      url: `/almaws/v1/bibs/${item.bib_data.mms_id}/holdings/${item.holding_data.holding_id}`,
      method: HttpMethod.GET,
      headers: {
        Accept: "application/xml"
      }
    };

    this.restService.call(holdingsRequest).subscribe(
      holding => {
        console.log(holding);
        const library = itemUpdate.library
        const location = itemUpdate.location

        // Parse the XML string
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(holding, "text/xml");

        // Find the 'datafield' node with tag="852"
        const dataFieldLocation = Array.from(xmlDoc.getElementsByTagName('datafield')).find(node => node.getAttribute('tag') === '852');

        if (dataFieldLocation) {
          const currentLibrary = Array.from(dataFieldLocation.getElementsByTagName('subfield')).find(node => node.getAttribute('code') === 'b');
          const currentLocation = Array.from(dataFieldLocation.getElementsByTagName('subfield')).find(node => node.getAttribute('code') === 'c');

          if (currentLibrary) currentLibrary.textContent = library;
          if (currentLocation) currentLocation.textContent = locationCodeMapping[location] || locationCodeMapping['default'];
        }

        const serializer = new XMLSerializer();
        const updatedXMLString = serializer.serializeToString(xmlDoc);

        const holdingsLocationUpdateRequest: Request = {
          url: `/almaws/v1/bibs/${item.bib_data.mms_id}/holdings/${item.holding_data.holding_id}`,
          method: HttpMethod.PUT,
          requestBody: updatedXMLString,
          headers: {
            Accept: "application/xml"
          }
        }

        return this.restService.call(holdingsLocationUpdateRequest)
      }
    )

    return this.restService.call(holdingsRequest)
  }
}
