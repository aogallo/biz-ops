# Interview

## Technical questions + strong sample answers

### How do you ensure your code is scalable and performant?

When designing scalable systems, I focus on:

- Proper architecture
- Database optimization
- Efficient APIs
- Monitoring and profiling

In my recent project building a multi-tenant accounting API using FastAPI and PostgreSQL,
I ensured scalability by separating domain logic from infrastructure using clean architecture
I optimized queries with proper indexing
I also designed tenant isolation carefully to avoid cross-tenant data leaks.
For performance, I benchmarked critical endpoints and used async I/O where appropriate.

### How do you ensure code quality?

Good answer includes:

- Unit testing
- Integration testing
- Code reviews
- CI/CD
- Linting & Formatting
- Static analysis

I write unit test for domain logic and integration test for API Layers.
I enforce code standards via linters and CI pipelines.
I also focus on readable, maintainable code rather than just clever solutions.

## Client communication questions

## Agile Questions

### What’s your experience with Agile?

I've worked in scrum teams participating in:

- Spring planning
- Daily stand-ups
- Retrospective
- Backlog grooming

I contribute to estimation using story points and
break features into small deliverable increments.

## Mentoring & Leadership

### How do you mentor other engineers?

I mentor by:

- Reviewing pull request constructively
- Explaining architectural decisions
- Encouraging clean code practice
- Helping them reason through problems instead of giving answer immediately

### How do you handle disagreements in architecture?

## Cloud & Containers Questions

### What’s your experience with Docker?

- Multi-stage builds
- Environment configs
- Docker compose
- Production considerations

I containerize backend service to ensure consistency across environments.
I separate application and infrastructure configuration via environment variables and avoid baking secrets into images

## WHAT IS OOP?

OOP is a programming methodology based on the representation of a software product as a collection of objects, each of which is an instance of a particular class. Object takes the main place in this software design approach. Object can be described as data structure (some state) plus some behavior to modify and interact with this data (state). OOP uses the interaction of objects as its basic elements.

## WHAT IS AN OBJECT?

An object is a named model of a real entity that has specific property values and manifests its behavior. Object has a set of data (fields and properties of an object) taht is physically located in the computer's memory. Also, object has methods that have access to the data (fields and properties). An object is a concrete instance of a class.

## NAME THE BASIC PRINCIPLES OF OOP

It is generally accepted that object-oriented programming is based on 4 basic principles (there were only 3 before). These principles are:

(Abstraction)
Encapsulation
Inheritance
Polymorphism

## WHAT IS INHERITANCE?

Inheritance is the process by which you can describe one type based on the other type. Also, during the inheritance, one object can acquire the properties of another object (inheritance of all the properties of one object by another)

and add features characteristic only of himself

class Dog extends Animal

{...}

Superclass -> Subclass

Parent -> Child

## WHAT IS POLYMORPHISM? WHAT MANIFESTATIONS OF POLYMORPHISM IN JAVA DO YOU KNOW?

Polymorphism (from the Greek polymorphos) is a property that allows the same name to be used to solve two or more similar but technically different tasks. The goal of polymorphism, as applied to object-oriented programming, is to use a single name to define common actions for a class. The execution of each specific action will be determined by the data type.

More generally, the concept of polymorphism is the idea of "one interface, many methods". This means that you can create a common interface for a group of similar actions.

For example, you have an acceleration pedal on an electric car and on a car with a gasoline engine. In both cases, pressing the acceleration pedal would bring us the same result - the car will go faster. But the way how exactly acceleration will be implemented in electric and non-electric cars - will be different because of the different car construction.

## WHAT IS ENCAPSULATION?

Encapsulation (encapsulation) - this is hiding the implementation of a class and separating its internal representation from the external (interface), this is a property that allows you to close access to the fields and methods of the class to other classes, and provide them with access only through the external interface (methods). When using an object-oriented approach, it is not ok to directly access the properties of a class from the methods of other classes. To access the properties of a class, usually you need to use special methods of this class to get and change its properties.

## WHAT ARE THE ADVANTAGES OF OBJECT-ORIENTED PROGRAMMING LANGUAGES?

1. Modularity for easier troubleshooting

When working with object-oriented programming languages, you know exactly where to look when something goes wrong. “Oh, the car object broke down? The problem must be in the Car class!” You don’t have to go line-by-line through all your code.

That’s the beauty of encapsulation. Objects are self-contained, and each bit of functionality does its own thing while leaving the other bits alone. Also, this modularity allows an IT team to work on multiple objects simultaneously while minimizing the chance that one person might duplicate someone else’s functionality.

1. Reuse of code through inheritance

Suppose that in addition to your Car object, one colleague needs a RaceCar object, and another needs a Limousine object. Everyone builds their objects separately but discover commonalities between them. In fact, each object is just a different kind of Car. This is where the inheritance technique saves time: Create one generic class (Car), and then define the subclasses (RaceCar and Limousine) that are to inherit the generic class’s traits.

Of course, Limousine and RaceCar still have their unique attributes and functions. If the RaceCar object needs a method to “fireAfterBurners” and the Limousine object requires a Chauffeur, each class could implement separate functions just for itself. However, because both classes inherit key aspects from the Car class, for example the “drive” or “fillUpGas” methods, your inheriting classes can simply reuse existing code instead of writing these functions all over again.

What if you want to make a change to all Car objects, regardless of type? This is another advantage of the OOP approach. Make a change to your Car class, and all car objects will simply inherit the new code.

1. Flexibility through polymorphism

Riffing on this example, you now need just a few drivers, or functions, like “driveCar,” driveRaceCar” and “DriveLimousine.” RaceCarDrivers share some traits with LimousineDrivers, but other things, like RaceHelmets and BeverageSponsorships, are unique.

This is where object-oriented programming’s polymorphism comes into play. Because a single function can shape-shift to adapt to whichever class it’s in, you could create one function in the parent Car class called “drive” — not “driveCar” or “driveRaceCar,” but just “drive.” This one function would work with the RaceCarDriver, LimousineDriver and so on. In fact, you could even have “raceCar.drive(myRaceCarDriver)” or “limo.drive(myChauffeur).”

1. Effective problem solving

Many people avoid learning OOP because the learning curve seems steeper than that for top-down programming. But take the time to master OOP and you’ll find it’s the easier, more intuitive approach for developing big projects.

Object-oriented programming is ultimately about taking a huge problem and breaking it down to solvable chunks. For each mini-problem, you write a class that does what you require. And then — best of all — you can reuse those classes, which makes it even quicker to solve the next problem.

This isn’t to say that OOP is the only way to write software. But there’s a reason that languages like C++, C# and Java are the go-to options for serious software development.

## WHAT DO YOU MEAN BY POLYMORPHISM, ENCAPSULATION AND DYNAMIC BINDING?

Polymorphism refers to the ability of a variable of a given type to refer to objects of different types by calling a method that is specific to the particular type of object reference.

What is the advantage of polymorphism? It allows you to add new derived object classes without breaking the calling code. The use of polymorphism is also called dynamic object binding.

Consider an example of polymorphism:

There are classes: Shape, circle and triangle.

The circle and triangle are inherited from the shape, respectively. Each class has a "draw" method. In circle and triangle, this method is overridden.

So, we create an object with the "Shape" type and assign it a reference to an object of the "Circle" type and call the "draw" method on this object. As a result, the method of the class "Circle" is called, and not the class "Shape" as expected.

Figure f = new Circle();

f.draw();

Also, instead of the "Shape" parent class, for example, you can use the "Shape" interface, defining the draw method there. We implement this interface in the "Circle" and "Triangle" classes. Next, we create an object on the interface and assign it a reference to an object of some of the classes that implement this interface.

We can say that we encapsulate behavior of drawShape() method.

This is convenient, for example, if we have a certain method:

public void drawShape(Shape f){

f.draw();

}

Please note that we are passing a parameter with the interface type to the method, i.e. we do not know what type of object will be there, but there is will be the implementation of such behavior behind the object. Further, we can simply create another class, for example, "Trapezoid", implement the "Shape" interface and simply pass an instance of the class to the method without changing anything in the implementation and call.

Definition of which exactly method will be invoked during the runtime, depending on which object will stand behind the reference - that is called dynamic binding.

## DESCRIBE ACCESS MODIFIERS IN JAVA

Java has the following access modifiers:

private: (used in constructors, inner classes, methods and class fields) - Access is allowed only in the current class.

default (package-private): (used in classes, constructors, interfaces, inner classes, methods and class fields) - Package level access. If the class is declared like this, it will only be available within the package.

protected: (used in constructors, inner classes, methods, and class fields) An access modifier at the package level and in the inheritance hierarchy.

public: (used in classes, constructors, interfaces, inner classes, methods and class fields) - Public access modifier, available to everyone.

The sequence of modifiers in descending order of privacy level: private, default ,protected, public).

## HOW DOES AN ABSTRACT CLASS DIFFER FROM AN INTERFACE? WHEN WOULD YOU USE AN ABSTRACT CLASS AND WHEN WOULD YOU USE THE INTERFACE?

An abstract class is a class that is marked "abstract" and may or may not contain abstract methods. An instance of an abstract class cannot be instantiated. A class that inherits from an abstract class may or may not implement abstract methods. In case child class doesn’t implement all abstract methods, then it must also be abstract. Also, if the inheritor class overrides the method implemented in the abstract parent class, it can be overridden with the abstract modifier! That is, to abandon the implementation. Accordingly, this class must also be abstract as well.

As for the interface, it contains only abstract methods and constants, this was the case before the release of Java 8. Starting with Java 8, in addition to abstract methods, we can also use standard methods (default methods) and static methods (static methods) in interfaces.

A Default method in an interface is a method in an interface with default logic that is not required to be defined in the implementation of that interface.

Static methods in an interface are essentially the same as static methods in an abstract class.

When implementing an interface, a class must implement all methods of the interface. Otherwise, the class must be marked as abstract. An interface can also contain inner classes. And no abstract methods in them.

Also, always remember that you can extend only one class in Java, but you can implement multiple interfaces.

What to use: Interface or Abstract class?

An abstract class is used when we need some kind of default implementation. An interface is used when a class needs to specify specific behavior. Often an interface and an abstract class are combined, i.e. implement an interface in an abstract class to specify the default behavior and implementation.
