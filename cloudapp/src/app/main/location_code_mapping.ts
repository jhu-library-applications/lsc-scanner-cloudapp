interface LocationCodeMapping {
  [key: string]: string;
}

export class LocationCode {
  static readonly mapping: LocationCodeMapping = {
    "shmanalnc": "shmoffs",
    "shmappr": "shmoffs",
    "shmartrf": "shmofarrf",
    "shmav": "shmofav",
    "shmavbd": "shmofav",
    "shmblue": "shmoffs",
    "shmbluenc": "shmoffs",
    "shmcdrm": "shmofav",
    "shmclasrf": "shmofclrf",
    "shmdesk": "shmoffs",
    "shmerc": "shmoffs",
    "shmgerf": "shmoffs",
    "shmhcom": "shmofav",
    "shmhisart": "shmofhiart",
    "shmmack": "shmofspc",
    "shmmain": "shmoffs",
    "shmmainb": "shmoffs",
    "shmmainbb": "shmoffs",
    "shmmaind": "shmoffs",
    "shmmainnc": "shmoffs",
    "shmmchn": "shmofspc",
    "shmnear": "shmofnear",
    "shmnearbl": "shmofnear",
    "shmpermres": "shmoffs",
    "shmrco": "shmoffs",
    "shmrcobl": "shmoffs",
    "shmresrxt": "shmoffs",
    "shmrestext": "shmoffs",
    "shmretai": "shmofretai",
    "shmretaib": "shmofretai",
    "shmspcoll": "shmofspc",
    "shmuglper": "shmoffs",
    "shmugrf": "shmoffs",
    "2305open": "2305open",
    "shmresdvd": "schmofav",
    "shmresbook": "shmoffs",
    "shdbook": "shmoffs",
    "default": "shmoffs"
  };

  public static getLocationCode(key: string): string {
    if (key in LocationCode.mapping) {
      return LocationCode.mapping[key];
    } else {
      return 'shmoffs';
    }
  }
}
