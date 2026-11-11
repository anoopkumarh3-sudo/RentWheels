package com.rentwheels.rentwheels_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RentwheelsBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(RentwheelsBackendApplication.class, args);
	}

}

/*
 * ==========================================================
 * PROJECT NAME: RENTWHEELS
 * TECHNOLOGY: JAVA + SPRING BOOT
 * ==========================================================
 *
 * JAVA CONCEPTS USED:
 *
 * 1. Classes and Objects
 * 2. Encapsulation
 * 3. Inheritance
 * 4. Polymorphism
 * 5. Abstraction
 * 6. Constructors
 * 7. Methods
 * 8. Method Overriding
 * 9. Data Validation
 *
 * This is a standalone academic demonstration.
 */

// MAIN APPLICATION CLASS
// CONCEPT: CLASS, OBJECT AND SPRING BOOT

package com.rentwheels;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Service;

import java.util.*;

// ==========================================================
// MAIN SPRING BOOT APPLICATION
// CONCEPT: CLASS, OBJECT, MAIN METHOD
// ==========================================================

@SpringBootApplication
public class RentWheels {

    public static void main(String[] args) {

        SpringApplication.run(RentWheels.class, args);

        System.out.println("RentWheels Application Started Successfully!");
    }
}


// ==========================================================
// VEHICLE ABSTRACT CLASS
// CONCEPT: ABSTRACTION + ENCAPSULATION
// ==========================================================

abstract class Vehicle {

    // ENCAPSULATION: PRIVATE DATA MEMBERS

    private String brand;
    private String model;
    private double dailyPrice;

    // CONSTRUCTOR

    public Vehicle(String brand, String model, double dailyPrice) {

        this.brand = brand;
        this.model = model;
        this.dailyPrice = dailyPrice;
    }

    // GETTER METHODS: ENCAPSULATION

    public String getBrand() {
        return brand;
    }

    public String getModel() {
        return model;
    }

    public double getDailyPrice() {
        return dailyPrice;
    }

    // ABSTRACTION: ABSTRACT METHOD

    public abstract String getVehicleType();

    // METHOD: RENTAL PRICE CALCULATION

    public double calculateRent(int days) {

        if (days <= 0) {
            throw new IllegalArgumentException("Invalid rental days");
        }

        return dailyPrice * days;
    }
}


// ==========================================================
// CAR CLASS
// CONCEPT: INHERITANCE + POLYMORPHISM + METHOD OVERRIDING
// ==========================================================

class Car extends Vehicle {

    // CONSTRUCTOR

    public Car(String brand, String model, double price) {

        super(brand, model, price);
    }

    // POLYMORPHISM: METHOD OVERRIDING

    @Override
    public String getVehicleType() {

        return "Car";
    }
}


// ==========================================================
// BIKE CLASS
// CONCEPT: INHERITANCE + POLYMORPHISM + METHOD OVERRIDING
// ==========================================================

class Bike extends Vehicle {

    // CONSTRUCTOR

    public Bike(String brand, String model, double price) {

        super(brand, model, price);
    }

    // POLYMORPHISM: METHOD OVERRIDING

    @Override
    public String getVehicleType() {

        return "Bike";
    }
}


// ==========================================================
// BOOKING CLASS
// CONCEPT: CLASS + OBJECT + ENCAPSULATION + CONSTRUCTOR
// ==========================================================

class Booking {

    // ENCAPSULATION: PRIVATE VARIABLES

    private String customerName;
    private Vehicle vehicle;
    private int rentalDays;
    private double totalAmount;

    // CONSTRUCTOR

    public Booking(String customerName, Vehicle vehicle, int days) {

        if (customerName == null || customerName.isBlank()) {
            throw new IllegalArgumentException("Customer name required");
        }

        if (vehicle == null || days <= 0) {
            throw new IllegalArgumentException("Invalid booking");
        }

        this.customerName = customerName;
        this.vehicle = vehicle;
        this.rentalDays = days;

        this.totalAmount = vehicle.calculateRent(days);
    }

    // GETTER METHODS: ENCAPSULATION

    public String getCustomerName() {
        return customerName;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public int getRentalDays() {
        return rentalDays;
    }

    public double getTotalAmount() {
        return totalAmount;
    }
}


// ==========================================================
// BOOKING SERVICE CLASS
// CONCEPT: CLASS + METHODS + OBJECT CREATION
// SPRING BOOT: SERVICE LAYER
// ==========================================================

@Service
class BookingService {

    public Booking createBooking(
            String customerName,
            Vehicle vehicle,
            int days) {

        return new Booking(customerName, vehicle, days);
    }
}


// ==========================================================
// DEMO CONTROLLER CLASS
// CONCEPT: REST API + METHODS + POLYMORPHISM
// SPRING BOOT: CONTROLLER LAYER
// ==========================================================

@RestController
@RequestMapping("/api/demo")
@CrossOrigin(origins = "*")
class DemoController {

    private final BookingService bookingService;

    // CONSTRUCTOR INJECTION

    public DemoController(BookingService bookingService) {

        this.bookingService = bookingService;
    }

    // GET API: DISPLAY VEHICLES

    @GetMapping("/vehicles")
    public List<Map<String, Object>> getVehicles() {

        // OBJECT CREATION

        Vehicle car = new Car("Hyundai", "Creta", 1000);

        Vehicle bike = new Bike(
            "Royal Enfield",
            "Classic 350",
            500
        );

        return List.of(

            Map.of(
                "type", car.getVehicleType(),
                "brand", car.getBrand(),
                "model", car.getModel(),
                "dailyPrice", car.getDailyPrice()
            ),

            Map.of(
                "type", bike.getVehicleType(),
                "brand", bike.getBrand(),
                "model", bike.getModel(),
                "dailyPrice", bike.getDailyPrice()
            )
        );
    }

    // POST API: CREATE DEMO BOOKING

    @PostMapping("/bookings")
    public Map<String, Object> createBooking(

            @RequestParam String customerName,
            @RequestParam String vehicleType,
            @RequestParam int days) {

        Vehicle vehicle;

        if (vehicleType.equalsIgnoreCase("car")) {

            vehicle = new Car("Hyundai", "Creta", 1000);

        } else if (vehicleType.equalsIgnoreCase("bike")) {

            vehicle = new Bike(
                "Royal Enfield",
                "Classic 350",
                500
            );

        } else {

            throw new IllegalArgumentException(
                "Invalid vehicle type"
            );
        }

        Booking booking = bookingService.createBooking(
            customerName,
            vehicle,
            days
        );

        return Map.of(
            "message", "Booking calculated successfully",
            "customer", booking.getCustomerName(),
            "vehicle", booking.getVehicle().getModel(),
            "days", booking.getRentalDays(),
            "totalAmount", booking.getTotalAmount()
        );
    }
}
