# caracteristicas

# definicion general
esta app tiene el fin de llegar el control de los medicamentos y saber en que almacen esta asi
asi como conocer que movimientos se realizaron y que usuario los realizo, asi como saber la cantidad
de cada item, una parte importante es que para este primer mvp no contaremos con base de datos, es decir 
tanto los items como los usuarios seran guardados en memoria con fines de agilizar la implementacion 

# pestañas del menu

- dashboard
- movimientos
- productos
- almacenes
- configuracion

# estructura de items

```javascript
const item: {
    sku: number;
    name: string;
    price: number;
    qty: number;
}

const user: {
    username: string;
    password: string;
    role: string;
}

const roles: [
    admin,
    empleado
]
```

el login debe ser simple y usar los que haya en la constante user, la disposicion de la app debe ser un menu desplegable lateral con las diferentes opciones de las pestañas del menu y debe tener animaciones optimizadas, debe tener un header y donde estara desplegable de la app en la izquieda y en la derecha debe tener un desplegable para la info del usuario

# importante

la app debe estar optimizada ampliamente para ser mobile first, ya que junto con una vista de tableta esta pensada en ser principalmente este, donde se estara usando.