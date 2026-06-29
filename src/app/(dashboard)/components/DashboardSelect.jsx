/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Select, { components } from "react-select";
import CreatableSelect from "react-select/creatable";

function DropdownIndicator(props) {
  return (
    <components.DropdownIndicator {...props}>
      <i className="fas fa-chevron-down" style={{ fontSize: "10px" }} />
    </components.DropdownIndicator>
  );
}

function ClearIndicator(props) {
  return (
    <components.ClearIndicator {...props}>
      <i className="fas fa-times" style={{ fontSize: "11px" }} />
    </components.ClearIndicator>
  );
}

function MultiValueRemove(props) {
  return (
    <components.MultiValueRemove {...props}>
      <i className="fas fa-times" style={{ fontSize: "9px" }} />
    </components.MultiValueRemove>
  );
}

function getSelectStyles({
  minHeight = 40,
  borderRadius = 10,
  fontSize = 13,
  hasError = false,
  controlBackground = "var(--dashboard-card-soft)",
  menuBackground = "var(--dashboard-card-bg)",
}) {
  const defaultBorder = hasError ? "var(--dashboard-danger)" : "var(--dashboard-card-border)";

  return {
    container: (base) => ({
      ...base,
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      overflow: "hidden",
    }),
    control: (base, state) => ({
      ...base,
      minHeight,
      borderRadius,
      border: `1.5px solid ${state.isFocused && !hasError ? "var(--dashboard-accent)" : defaultBorder}`,
      background: controlBackground,
      boxShadow: state.isFocused
        ? `0 0 0 3px ${hasError ? "rgba(241, 116, 123, 0.14)" : "var(--dashboard-accent-soft)"}`
        : "none",
      transition: "all 0.18s ease",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      maxWidth: "100%",
      minWidth: 0,
      overflow: "hidden",
      ":hover": {
        borderColor: hasError
          ? "var(--dashboard-danger)"
          : state.isFocused
            ? "var(--dashboard-accent)"
            : "var(--dashboard-border-soft)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      minHeight: minHeight - 2,
      padding: "0 12px",
      gap: "6px",
      maxWidth: "100%",
      overflow: "hidden",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: "var(--dashboard-text)",
      fontFamily: "var(--font-open-sans), sans-serif",
      fontWeight: 400,
      fontSize,
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--dashboard-text-muted)",
      fontFamily: "var(--font-open-sans), sans-serif",
      fontWeight: 400,
      fontSize,
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--dashboard-text)",
      fontFamily: "var(--font-open-sans), sans-serif",
      fontWeight: 400,
      fontSize,
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),
    multiValue: (base) => ({
      ...base,
      margin: 0,
      borderRadius: 999,
      background: "var(--dashboard-accent-soft)",
      overflow: "hidden",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "var(--dashboard-accent)",
      fontSize: 11,
      fontFamily: "var(--font-open-sans), sans-serif",
      fontWeight: 500,
      padding: "4px 8px",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "var(--dashboard-accent)",
      padding: "0 7px",
      ":hover": {
        color: "#ffffff",
        background: "var(--dashboard-accent)",
      },
    }),
    indicatorsContainer: (base) => ({
      ...base,
      minHeight: minHeight - 2,
      paddingRight: "4px",
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "var(--dashboard-accent)" : "var(--dashboard-text-muted)",
      padding: "0 8px",
      transition: "color 0.18s ease",
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "var(--dashboard-text-muted)",
      padding: "0 6px",
      transition: "color 0.18s ease",
      ":hover": {
        color: "var(--dashboard-text)",
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base) => ({
      ...base,
      width: "100%",
      marginTop: 6,
      overflow: "hidden",
      border: "1.5px solid var(--dashboard-card-border)",
      borderRadius: 12,
      background: menuBackground,
      boxShadow: "0 16px 36px -18px rgba(32, 32, 37, 0.35)",
    }),
    menuList: (base) => ({
      ...base,
      padding: 6,
      maxHeight: 260,
    }),
    option: (base, state) => ({
      ...base,
      display: "flex",
      alignItems: "center",
      minHeight: 32,
      padding: "6px 12px",
      borderRadius: 6,
      fontSize,
      fontFamily: "var(--font-open-sans), sans-serif",
      fontWeight: 400,
      color: state.isSelected ? "#ffffff" : "var(--dashboard-text-soft)",
      background: state.isSelected
        ? "var(--dashboard-accent)"
        : state.isFocused
          ? "var(--dashboard-card-soft)"
          : "transparent",
      cursor: "pointer",
      transition: "background 0.16s ease, color 0.16s ease",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      padding: "12px 14px",
      color: "var(--dashboard-text-muted)",
      fontSize: 12,
    }),
    loadingMessage: (base) => ({
      ...base,
      padding: "12px 14px",
      color: "var(--dashboard-text-muted)",
      fontSize: 12,
    }),
  };
}

function BaseDashboardSelect({
  SelectComponent = Select,
  minHeight = 40,
  borderRadius = 10,
  fontSize = 13,
  hasError = false,
  controlBackground,
  menuBackground,
  components: customComponents,
  ...props
}) {
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setPortalTarget(document.querySelector('[class*="pageShell"]') || document.body);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <SelectComponent
      unstyled
      menuPlacement="auto"
      menuPosition="fixed"
      menuPortalTarget={portalTarget || undefined}
      components={{
        DropdownIndicator,
        ClearIndicator,
        MultiValueRemove,
        IndicatorSeparator: null,
        ...customComponents,
      }}
      styles={getSelectStyles({
        minHeight,
        borderRadius,
        fontSize,
        hasError,
        controlBackground,
        menuBackground,
      })}
      {...props}
    />
  );
}

export function DashboardSelect(props) {
  return <BaseDashboardSelect {...props} />;
}

export function DashboardCreatableSelect(props) {
  return (
    <BaseDashboardSelect
      SelectComponent={CreatableSelect}
      formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
      {...props}
    />
  );
}

function PostOptionContent({ option }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
      {option.image ? (
        <img
          src={option.image}
          alt=""
          style={{
            width: "46px",
            height: "30px",
            borderRadius: "6px",
            objectFit: "cover",
            background: "var(--dashboard-border-soft)",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "46px",
            height: "30px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--dashboard-card-soft)",
            color: "var(--dashboard-text-muted)",
            flexShrink: 0,
          }}
        >
          <i className="far fa-image" style={{ fontSize: "12px" }} />
        </div>
      )}
      <div style={{ minWidth: 0, display: "grid", gap: "2px" }}>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "inherit",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {option.label}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "inherit",
            opacity: 0.72,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {option.meta || option.value}
        </span>
      </div>
    </div>
  );
}

function PostOption(props) {
  return (
    <components.Option {...props}>
      <PostOptionContent option={props.data} />
    </components.Option>
  );
}

export function createPostSelectOption(post) {
  return {
    value: post.slug,
    label: post.title,
    meta: post.category,
    image: post.image || "",
    searchText: `${post.title} ${post.category} ${post.slug}`.toLowerCase(),
  };
}

export function DashboardPostPicker({
  options,
  onSelect,
  placeholder = "Search and select...",
  inputId,
  noOptionsMessage,
  ...props
}) {
  const [inputValue, setInputValue] = useState("");

  return (
    <DashboardSelect
      inputId={inputId}
      instanceId={inputId}
      value={null}
      options={options}
      isSearchable
      controlShouldRenderValue={false}
      backspaceRemovesValue={false}
      placeholder={placeholder}
      onChange={(option) => {
        if (!option) return;
        onSelect?.(option);
        setInputValue("");
      }}
      inputValue={inputValue}
      onInputChange={(nextValue, meta) => {
        if (meta.action === "input-change") {
          setInputValue(nextValue);
        }
        if (meta.action === "menu-close") {
          setInputValue("");
        }
      }}
      filterOption={(candidate, rawInput) =>
        candidate.data.searchText.includes(rawInput.trim().toLowerCase())
      }
      noOptionsMessage={() =>
        inputValue.trim()
          ? noOptionsMessage || "No matching published posts found."
          : "Type to search published posts..."
      }
      components={{
        Option: PostOption,
      }}
      {...props}
    />
  );
}
