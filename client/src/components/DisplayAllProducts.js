import React, {useEffect, useMemo, useState} from "react"
import {Link} from "react-router-dom"
import axios from "axios"
import {ProductTable} from "./ProductTable"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"


const PRICE_RANGES = [
    {value: "any", label: "Any price"},
    {value: "0-24.99", label: "Under €25"},
    {value: "25-29.99", label: "€25 - €29"},
    {value: "30-34.99", label: "€30 - €34"},
    {value: "35-39.99", label: "€35 - €39"},
    {value: "40-999", label: "€40 +"}
]

const CAPACITY_RANGES = [
    {value: "any", label: "Any capacity"},
    {value: "500-500", label: "500 ml"},
    {value: "550-550", label: "550 ml"},
    {value: "600-600", label: "600 ml"},
    {value: "650-650", label: "650 ml"},
    {value: "700-700", label: "700 ml"},
    {value: "750-750", label: "750 ml"}
]

const parseRange = (rangeValue) => {
    const [minValue, maxValue] = rangeValue.split("-")
    return {
        min: Number(minValue),
        max: Number(maxValue)
    }
}

const matchesRange = (value, rangeValue) => {
    // "any" keeps the filter inactive for this field.
    if (rangeValue === "any") {
        return true
    }

    // Empty or non-numeric product values should not pass numeric range filters.
    if (value === null || typeof value === "undefined" || value === "") {
        return false
    }

    const {min, max} = parseRange(rangeValue)
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) {
        return false
    }

    return numericValue >= min && numericValue <= max
}

const normalizeText = (value) => (value || "").toString().trim()

export const DisplayAllProducts = ({searchName = "", setSearchName = () => {}, cartItems = [], onAddToCart}) => {
    const [products, setProducts] = useState([])
    const [materialFilter, setMaterialFilter] = useState("any")
    const [colorFilters, setColorFilters] = useState([])
    const [isColorFilterOpen, setIsColorFilterOpen] = useState(false)
    const [priceFilter, setPriceFilter] = useState("any")
    const [capacityFilter, setCapacityFilter] = useState("any")
    const [sortConfig, setSortConfig] = useState({column: "name", direction: "asc"})

    useEffect(() => {
        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.get(`${SERVER_HOST}/products`, {headers: {"authorization": localStorage.token}})
            .then(res => {
                setProducts(Array.isArray(res.data) ? res.data : [])
            })
            .catch(() => {
                setProducts([])
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }, [])

    // Build selectable options from actual dataset values to avoid hardcoding.
    const materialOptions = useMemo(() => {
        return Array.from(
            new Set(products.map((product) => normalizeText(product.material)).filter((value) => value !== ""))
        ).sort((first, second) => first.localeCompare(second))
    }, [products])

    // Keep color options in sync with server data and sorted for stable UI.
    const colorOptions = useMemo(() => {
        return Array.from(
            new Set(products.map((product) => normalizeText(product.color)).filter((value) => value !== ""))
        ).sort((first, second) => first.localeCompare(second))
    }, [products])

    useEffect(() => {
        setColorFilters((currentFilters) => currentFilters.filter((color) => colorOptions.includes(color)))
    }, [colorOptions])

    useEffect(() => {
        if (colorOptions.length === 0) {
            setIsColorFilterOpen(false)
        }
    }, [colorOptions])

    const normalizedSearch = searchName.trim().toLowerCase()
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN

    const filteredProducts = products.filter((product) => {
        const name = normalizeText(product.name).toLowerCase()
        const description = normalizeText(product.description).toLowerCase()

        if (normalizedSearch && !name.includes(normalizedSearch) && !description.includes(normalizedSearch)) {
            return false
        }

        if (materialFilter !== "any" && normalizeText(product.material) !== materialFilter) {
            return false
        }

        if (colorFilters.length > 0 && !colorFilters.includes(normalizeText(product.color))) {
            return false
        }

        if (!matchesRange(product.price, priceFilter)) {
            return false
        }

        if (!matchesRange(product.capacityMl, capacityFilter)) {
            return false
        }

        return true
    })

    const clearAllFilters = () => {
        setSearchName("")
        setMaterialFilter("any")
        setColorFilters([])
        setIsColorFilterOpen(false)
        setPriceFilter("any")
        setCapacityFilter("any")
    }

    const toggleColorFilter = (color) => {
        setColorFilters((currentFilters) => {
            if (currentFilters.includes(color)) {
                return currentFilters.filter((value) => value !== color)
            }

            return [...currentFilters, color]
        })
    }

    const activeFilterChips = []
    const colorFilterLabel = colorFilters.length === 0 ? "Any color" : `${colorFilters.length} selected`

    // Chips mirror active filters and provide one-click reset per filter.
    if (normalizedSearch) {
        activeFilterChips.push({
            key: "search",
            label: `Search: ${searchName.trim()}`,
            clear: () => setSearchName("")
        })
    }
    if (materialFilter !== "any") {
        activeFilterChips.push({
            key: "material",
            label: `Material: ${materialFilter}`,
            clear: () => setMaterialFilter("any")
        })
    }
    if (colorFilters.length > 0) {
        colorFilters.forEach((color) => {
            activeFilterChips.push({
                key: `color-${color}`,
                label: `Color: ${color}`,
                clear: () => setColorFilters((currentFilters) => currentFilters.filter((value) => value !== color))
            })
        })
    }
    if (priceFilter !== "any") {
        const selectedPriceLabel = PRICE_RANGES.find((range) => range.value === priceFilter)?.label || priceFilter
        activeFilterChips.push({
            key: "price",
            label: `Price: ${selectedPriceLabel}`,
            clear: () => setPriceFilter("any")
        })
    }
    if (capacityFilter !== "any") {
        const selectedCapacityLabel = CAPACITY_RANGES.find((range) => range.value === capacityFilter)?.label || capacityFilter
        activeFilterChips.push({
            key: "capacity",
            label: `Capacity: ${selectedCapacityLabel}`,
            clear: () => setCapacityFilter("any")
        })
    }

    return (
        <div className="container catalog-page">
            <div className="catalog-toolbar">
                <div className="catalog-search-row">
                    <input
                        className="catalog-search-input"
                        type="text"
                        placeholder="Search products by name or description..."
                        value={searchName}
                        onChange={(event) => setSearchName(event.target.value)}
                    />
                    <button className="blue-button" type="button" onClick={() => setSearchName("")}>Clear</button>
                </div>

                {activeFilterChips.length > 0 ? (
                    <div className="catalog-active-filters">
                        {activeFilterChips.map((chip) => (
                            <button key={chip.key} type="button" className="catalog-filter-chip" onClick={chip.clear}>
                                {chip.label} x
                            </button>
                        ))}
                        <button type="button" className="catalog-clear-all" onClick={clearAllFilters}>
                            Clear all filters
                        </button>
                    </div>
                ) : null}
            </div>

            <div className="catalog-layout">
                <aside className="catalog-filters">
                    <h3>Filters</h3>

                    <div className="catalog-filter-group">
                        <label htmlFor="materialFilter">Material</label>
                        <select
                            id="materialFilter"
                            value={materialFilter}
                            onChange={(event) => setMaterialFilter(event.target.value)}
                        >
                            <option value="any">Any material</option>
                            {materialOptions.map((material) => (
                                <option key={material} value={material}>{material}</option>
                            ))}
                        </select>
                    </div>

                    <div className="catalog-filter-group">
                        <label>Color</label>
                        <button
                            id="colorFilterToggle"
                            type="button"
                            className={`catalog-multiselect-toggle${isColorFilterOpen ? " is-open" : ""}`}
                            onClick={() => setIsColorFilterOpen((currentState) => !currentState)}
                            aria-haspopup="true"
                            aria-expanded={isColorFilterOpen}
                            aria-controls="colorFilterOptions"
                            disabled={colorOptions.length === 0}
                        >
                            <span>{colorOptions.length === 0 ? "No colors available" : colorFilterLabel}</span>
                        </button>

                        {isColorFilterOpen ? (
                            <div id="colorFilterOptions" className="catalog-checkbox-list" role="group" aria-label="Color filter">
                                {colorOptions.map((color) => (
                                    <label key={color} className="catalog-checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={colorFilters.includes(color)}
                                            onChange={() => toggleColorFilter(color)}
                                        />
                                        <span>{color}</span>
                                    </label>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="catalog-filter-group">
                        <label htmlFor="priceFilter">Price</label>
                        <select id="priceFilter" value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                            {PRICE_RANGES.map((range) => (
                                <option key={range.value} value={range.value}>{range.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="catalog-filter-group">
                        <label htmlFor="capacityFilter">Capacity</label>
                        <select
                            id="capacityFilter"
                            value={capacityFilter}
                            onChange={(event) => setCapacityFilter(event.target.value)}
                        >
                            {CAPACITY_RANGES.map((range) => (
                                <option key={range.value} value={range.value}>{range.label}</option>
                            ))}
                        </select>
                    </div>

                    <button type="button" className="red-button catalog-reset-button" onClick={clearAllFilters}>
                        Reset filters
                    </button>
                </aside>

                <section className="catalog-results">
                    <div className="catalog-results-head">
                        <h2>{filteredProducts.length} products found</h2>
                        {isAdmin ? (
                            <Link
                                className="catalog-add-product-link"
                                to="/AddProduct"
                                aria-label="Add Product"
                                title="Add Product"
                            >
                                <img className="catalog-add-product-icon" src="/images/buttons/admin/add_product.png" alt="Add Product"/>
                            </Link>
                        ) : null}
                    </div>

                    <div className="table-container catalog-table-wrap">
                        {filteredProducts.length === 0 ? (
                            <p className="catalog-empty">No products found for the selected filters.</p>
                        ) : (
                            <ProductTable
                                products={filteredProducts}
                                cartItems={cartItems}
                                onAddToCart={onAddToCart}
                                sortConfig={sortConfig}
                                onSortChange={setSortConfig}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
