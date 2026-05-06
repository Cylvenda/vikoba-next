export type User = {
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
    password?: string
}

export type PassengerInfo = {
    schedule_id: number,
    bus_id: number,
    seatNumber: string; 
    startJournal: string;
    endJournal: string;
    idType: "passport" | "drivingLicense" | "nida" | "voterID" | "TIN" | "none";
    idNumber?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    phonePaymentNumber?: string;
    gender: "M" | "F";
    ageGroup: "adult" | "child" | "infant" | "elder";
    country: string;
}

export type PassengerFinalInfo = {
    schedule_id: number,
    bus_assignment_id: number,
    seat_number: string;
    passenger: PassengerData
}

export type PassengerData = {
    boarding_point: string;
    dropping_point: string;
    id_type: "passport" | "drivingLicense" | "nida" | "voterID" | "TIN" | "none";
    id_number?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_payment_number?: string;
    gender: "M" | "F";
    age_group: "adult" | "child" | "infant" | "elder";
    nationality: string;
}