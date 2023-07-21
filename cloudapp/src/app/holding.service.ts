import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib';
import { ItemUpdate } from './interfaces/item_update.interface';

@Injectable({
  providedIn: 'root'
})

export class HoldingService {

  constructor(private restService: CloudAppRestService) { }

  updateHoldingsRecord(itemUpdate: ItemUpdate) {
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

        // Your new values
        let library = itemUpdate.library
        let location = itemUpdate.location

        // Parse the XML string
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(holding, "text/xml");

        // Find the 'datafield' node with tag="852"
        let dataFieldLocation = Array.from(xmlDoc.getElementsByTagName('datafield')).find(node => node.getAttribute('tag') === '852');

        if (dataFieldLocation) {
          // Find 'subfield' nodes with code="b" and code="c"
          let currentLibrary = Array.from(dataFieldLocation.getElementsByTagName('subfield')).find(node => node.getAttribute('code') === 'b');
          let currentLocation = Array.from(dataFieldLocation.getElementsByTagName('subfield')).find(node => node.getAttribute('code') === 'c');

          // Update their values
          if (currentLibrary) currentLibrary.textContent = library;
          if (currentLocation) currentLocation.textContent = location;
        }

        // Convert the updated XML document back to a string
        let serializer = new XMLSerializer();
        let updatedXMLString = serializer.serializeToString(xmlDoc);

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
  }
}
